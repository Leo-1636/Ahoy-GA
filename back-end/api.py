import asyncio
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware

from clients.gemini import ChatGemini
from clients.gpt import ChatGPT
from clients.flux import ChatFLUX

from config import root_path, image_model, set_api_key
from utils import image_util, path_util, status_util

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

@app.get("/status")
async def get_status_endpoint():
    return status_util.get_status()

@app.post("/settings/api-key")
async def set_api_key_endpoint(
    gemini_api_key: Optional[str] = Form(None),
    chatgpt_api_key: Optional[str] = Form(None),
):
    set_api_key(gemini_api_key, chatgpt_api_key)
    return {"success": True}

@app.get("/images")
async def get_images_endpoint():
    images = {
        "original": [],
        "datasets": [],
    }
    for image_path in root_path.original.glob("*.png"):
        images["original"].append({
            "path": f"original/{image_path.name}",
            "hasTag": False
        })
    for image_path in root_path.datasets.glob("*.png"):
        images["datasets"].append({
            "path": f"datasets/{image_path.name}",
            "hasTag": False
        })
    return images

_preview_cache: dict[tuple[str, int], bytes] = {}

@app.get("/images/{image_path:path}")
async def get_image_endpoint(image_path: str, preview: bool = False):
    path = path_util.to_path(image_path)
    if not path.exists():
        raise HTTPException(status_code = 404, detail = "Image not found")

    if preview:
        mtime = int(path.stat().st_mtime)
        cache_key = (str(path), mtime)
        cached = _preview_cache.get(cache_key)
        if cached is None:
            if len(_preview_cache) > 128:
                _preview_cache.clear()
            cached = await asyncio.to_thread(image_util.to_preview_bytes, path)
            _preview_cache[cache_key] = cached
        return Response(
            content = cached,
            media_type = "image/jpeg",
            headers = {"Cache-Control": "public, max-age=86400"},
        )

    return FileResponse(
        path,
        media_type = "image/png",
        headers = {"Cache-Control": "public, max-age=86400"},
    )

@app.post("/images/cut")
async def cut_image_endpoint(image_path: str, x: int, y: int, width: int, height: int):
    source_path = path_util.to_path(image_path)
    if not source_path.exists():
        raise HTTPException(status_code = 404, detail = "Source image not found")
    
    source_image = image_util.open_image(source_path)
    target_image = source_image.crop((x, y, x + width, y + height))
    target_path = root_path.datasets / f"{path_util.generate_uuid()}.png"
    image_util.save_image(target_image, target_path)
    
    return {
        "success": True,
        "path": f"datasets/{target_path.name}"
    }

@app.post("/images/arrow")
async def arrow_image_endpoint(image_path: str, start_x: int, start_y: int, end_x: int, end_y: int, color: str = "#ff0000"):
    source_path = path_util.to_path(image_path)
    if not source_path.exists():
        raise HTTPException(status_code = 404, detail = "Source image not found")

    source_image = image_util.open_image(source_path)
    target_image = image_util.draw_arrow(source_image, start_x, start_y, end_x, end_y, color)
    image_util.save_image(target_image, source_path)
    
    return {
        "success": True,
        "path": f"datasets/{source_path.name}"
    }

@app.post("/images/tag")
async def tag_image_endpoint(image_path: str, tag_content: str):
    tag_path = path_util.to_txt_path(image_path)
    tag_path.write_text(tag_content, encoding = "utf-8")
    
    return {
        "success": True,
        "path": f"datasets/{tag_path.name}"
    }

@app.post("/images/delete")
async def delete_images_endpoint(image_paths: list[str]):
    for image_path in image_paths:
        try:
            path_util.to_path(image_path).unlink()
        except Exception:
            raise HTTPException(status_code = 400, detail = f"Failed to delete image: {image_path}")
    
    return {"success": True}

@app.post("/generate/image")
async def generate_image_endpoint(
    model: str = Form(...),
    resolution: str = Form(...),
    aspect_ratio: str = Form(...),
    system_prompt: str = Form(...),
    user_prompt: str = Form(...),
    image_prompts: List[UploadFile] = File(default=[])
):
    image_list = []
    for image_prompt in image_prompts:
        contents = await image_prompt.read()
        image_list.append(image_util.open_bytes(contents))

    if model in [image_model.nano_banana_2, image_model.nano_banana_pro]:
        client = ChatGemini(
            model = model,
            resolution = resolution,
            aspect_ratio = aspect_ratio
        )
        image = await asyncio.to_thread(client.chat_image, system_prompt, user_prompt, image_list)
        
    elif model in [image_model.flux2_klein_4b, image_model.flux2_klein_9b]:
        client = ChatFLUX(
            model        = model,
            resolution   = resolution,
            aspect_ratio = aspect_ratio,
        )
        image = await asyncio.to_thread(client.chat_image, system_prompt, user_prompt, image_list)

    image_path = root_path.original / f"{path_util.generate_uuid()}.png"
    image_util.save_image(image = image, path = image_path)

    return {
        "success": True,
        "path": f"original/{image_path.name}"
    }

@app.post("/generate/text")
async def generate_text_endpoint(
    model: str = Form(...),
    system_prompt: str = Form(...),
    user_prompt: str = Form(...),
    image_path: str = Form(...)
):
    image_path = path_util.to_path(image_path)
    if not image_path.exists():
        raise HTTPException(status_code = 404, detail = "Image not found")

    client = ChatGPT(model)
    response = client.chat_text(
        system_prompt = system_prompt,
        user_prompt = user_prompt,
        image_prompt = [image_util.open_image(image_path)]
    )
    return {
        "success": True,
        "text": response
    }

if __name__ == "__main__":
    uvicorn.run(app, port = 8000, reload = True)
