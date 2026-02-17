from typing import List
from pydantic import BaseModel

import uvicorn
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import Response, FileResponse
from fastapi.middleware.cors import CORSMiddleware

from clients.gemini import gereate_image as gemini_generate_image
from clients.flux import generate_image as flux_generate_image
from clients.gpt import generate_text

from config.config import path as config_path
from utils import image_util, system_util

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

@app.get("/api/images")
async def get_images():
    result = {
        "originals": [],
        "datasets": []
    }
    
    originals_path = config_path.original
    if originals_path.exists():
        for file in originals_path.glob("*.png"):
            result["originals"].append({
                "name": file.name,
                "path": f"originals/{file.name}",
                "hasTag": False
            })
    
    datasets_path = config_path.datasets
    if datasets_path.exists():
        for file in datasets_path.glob("*.png"):
            txt_file = datasets_path / f"{file.stem}.txt"
            result["datasets"].append({
                "name": file.name,
                "path": f"datasets/{file.name}",
                "hasTag": txt_file.exists()
            })
    
    return result

@app.get("/api/images/{folder}/{filename}")
async def get_image(folder: str, filename: str):
    try:
        file_path = system_util.get_image_path(folder, filename)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path, media_type="image/png")

@app.post("/api/generate-image")
async def generate_image_endpoint(
    system_prompt: str = Form(...),
    user_prompt: str = Form(...),
    model: str = Form(default="gemini"),
    files: List[UploadFile] = File(default=[])
):
    images_list = []
    for file in files:
        contents = await file.read()
        images_list.append(image_util.open_bytes(contents))

    if model == "flux":
        generated_image = flux_generate_image(
            system_prompt = system_prompt,
            user_prompt = user_prompt,
            images = images_list
        )
    else:
        generated_image = gemini_generate_image(
            system_prompt= system_prompt,
            user_prompt = user_prompt,
            images = images_list
        )

    return Response(
        content=image_util.to_bytes(generated_image),
        media_type="image/png"
    )

@app.post("/api/generate-text")
async def generate_text_endpoint(
    system_prompt: str = Form(...),
    user_prompt: str = Form(...),
    image: UploadFile = File(...),
    image_path: str = Form(...)
):
    contents = await image.read()
    generated_text = generate_text(
        system_prompt = system_prompt,
        user_prompt = user_prompt,
        image = image_util.open_bytes(contents)
    )
    
    try:
        folder, filename = system_util.parse_path(image_path)
        txt_path = system_util.get_txt_path(folder, filename)
        txt_path.write_text(generated_text, encoding="utf-8")
    except ValueError:
        pass
    
    return Response(
        content = generated_text,
        media_type = "text/plain"
    )

class CutImageRequest(BaseModel):
    image_path: str
    x: int
    y: int
    width: int
    height: int

@app.post("/api/cut-image")
async def cut_image_endpoint(request: CutImageRequest):
    try:
        folder, filename = system_util.parse_path(request.image_path)
        source_path = system_util.get_image_path(folder, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not source_path.exists():
        raise HTTPException(status_code=404, detail="Source image not found")
    
    image = image_util.open_image(str(source_path))
    cropped = image.crop((
        request.x,
        request.y,
        request.x + request.width,
        request.y + request.height
    ))
    
    new_filename = f"{system_util.generate_uuid()}.png"
    save_path = config_path.datasets / new_filename
    image_util.save_image(cropped, save_path)
    
    return {
        "success": True,
        "path": f"datasets/{new_filename}"
    }

class SaveTagRequest(BaseModel):
    image_path: str
    tag_content: str

@app.post("/api/save-tag")
async def save_tag_endpoint(request: SaveTagRequest):
    try:
        folder, filename = system_util.parse_path(request.image_path)
        txt_path = system_util.get_txt_path(folder, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    txt_path.write_text(request.tag_content, encoding="utf-8")
    name_without_ext = filename.rsplit(".", 1)[0]
    return {"success": True, "path": f"{folder}/{name_without_ext}.txt"}

class SaveArrowImageRequest(BaseModel):
    image_path: str
    start_x: int
    start_y: int
    end_x: int
    end_y: int

@app.post("/api/save-arrow-image")
async def save_arrow_image_endpoint(request: SaveArrowImageRequest):
    try:
        folder, filename = system_util.parse_path(request.image_path)
        source_path = system_util.get_image_path(folder, filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not source_path.exists():
        raise HTTPException(status_code=404, detail="Source image not found")

    image = image_util.open_image(str(source_path))
    image = image_util.draw_arrow(
        image,
        request.start_x,
        request.start_y,
        request.end_x,
        request.end_y,
    )
    if folder == "originals":
        new_filename = f"{system_util.generate_uuid()}.png"
        save_path = config_path.datasets / new_filename
        image_util.save_image(image.convert("RGB"), save_path)
        return {
            "success": True,
            "path": f"datasets/{new_filename}"
        }
    else:
        image_util.save_image(image.convert("RGB"), source_path)
        return {
            "success": True,
            "path": request.image_path
        }
    
class DeleteImagesRequest(BaseModel):
    paths: List[str]

@app.post("/api/delete-images")
async def delete_images_endpoint(request: DeleteImagesRequest):
    deleted_images = []
    failed_images = []
    
    for image_path in request.paths:
        try:
            folder, filename = system_util.parse_path(image_path)
            file_path = system_util.get_image_path(folder, filename)
        except ValueError:
            failed_images.append(image_path)
            continue
        if file_path.exists():
            try:
                file_path.unlink()
                deleted_images.append(image_path)
            except Exception:
                failed_images.append(image_path)
        else:
            failed_images.append(image_path)
    
    return {
        "deleted": deleted_images,
        "failed": failed_images
    }

if __name__ == "__main__":
    uvicorn.run(app, port=8000)
