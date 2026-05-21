import asyncio
from typing import List

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from config import Paths, ApiKeys
from utils.image_io import ImageIO
from utils.path_io import PathIO
from runtime.status import device_status

from clients.gemini import Gemini, Gemini_Image
from clients.gpt import ChatGPT, ChatGPT_Image
from clients.flux import FLUX_Image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Paths.original.mkdir(parents=True, exist_ok=True)
Paths.datasets.mkdir(parents=True, exist_ok=True)

# ── Status ──
status = device_status()

@app.get("/status")
async def get_status():
    try:
        if status.get_cuda():
            return {
                "mode": "GPU",
                **status.get_device(),
                **status.get_memory(),
            }
        return {"mode": "CPU"}
    except Exception:
        return {"mode": "Unavailable"}

@app.post("/status/reset")
async def reset_status():
    try:
        if status.get_cuda():
            status.reset_memory()
        return {"success": True}
    except Exception:
        return {"success": False, "error": "Failed to reset status"}
        
# ── Settings ──

@app.post("/settings/api-key")
async def set_api_key(name: str, key: str):
    try:
        ApiKeys.set(name, key)
        return {"success": True}
    except Exception:
        return {"success": False, "error": "Failed to set API key"}

# ── Images CRUD ──

@app.get("/images")
async def get_images():
    images = {
        "original": [], 
        "datasets": [],
    }
    for image in sorted(Paths.original.glob("*.png")):
        txt = Paths.datasets / f"{image.stem}.txt"
        images["original"].append({
            "path": f"original/{image.name}",
            "hasTag": txt.exists(),
        })
    for image in sorted(Paths.datasets.glob("*.png")):
        txt = Paths.datasets / f"{image.stem}.txt"
        images["datasets"].append({
            "path": f"datasets/{image.name}",
            "hasTag": txt.exists(),
        })
    return images

@app.get("/images/{image_path:path}")
async def get_image(image_path: str):
    path = PathIO.get_path(image_path)
    if not path.exists():
        raise HTTPException(status_code = 404, detail = "Image not found")

    return FileResponse(
        path,
        media_type = "image/png",
    )

@app.post("/images/cut")
async def cut_image(
    image_path: str, 
    x: int, y: int, width: int, height: int,
):
    source_path = PathIO.get_path(image_path)
    if not source_path.exists():
        raise HTTPException(status_code = 404, detail = "Source image not found")

    source_image = ImageIO.open_image(source_path)
    target_image = ImageIO.crop_image(source_image, x, y, width, height)
    target_path = PathIO.get_image_path(PathIO.get_timestamp())
    ImageIO.save_image(target_image, target_path)

    return {"success": True, "path": f"datasets/{target_path.name}"}

@app.post("/images/arrow")
async def arrow_image(
    image_path: str,
    start_x: int, start_y: int,
    end_x: int, end_y: int,
    color: str = "#ff0000",
):
    source_path = PathIO.get_path(image_path)
    if not source_path.exists():
        raise HTTPException(status_code = 404, detail = "Source image not found")

    source_image = ImageIO.open_image(source_path)
    target_image = ImageIO.draw_arrow(source_image, start_x, start_y, end_x, end_y, color)
    target_path = PathIO.get_image_path(PathIO.get_timestamp())
    ImageIO.save_image(target_image, target_path)

    return {"success": True, "path": f"datasets/{target_path.name}"}

@app.post("/images/import")
async def import_images(files: List[UploadFile] = File(...)):
    images = []
    for file in files:
        try:
            if file.filename:
                target_path = PathIO.get_original(file.filename)
                target_path.write_bytes(await file.read())
                images.append(f"original/{file.filename}")
        
        except Exception as error:
            raise HTTPException(status_code = 400, detail = f"Failed to import: {file.filename}") from error
    return {"success": True, "images": images, "count": len(images)}

@app.post("/images/delete")
async def delete_images(image_paths: list[str]):
    for image_path in image_paths:
        try:
            path = PathIO.get_path(image_path)
            if path.exists():
                path.unlink()
            else:
                raise HTTPException(status_code = 404, detail = "Source image not found")
        
        except Exception as error:
            raise HTTPException(status_code = 400, detail = f"Failed to delete: {image_path}") from error
    return {"success": True, "deleted": image_paths}

# ── Tags CRUD ──

@app.post("/tags")
async def create_tag(image_path: str, content: str):
    image_name = PathIO.get_name(image_path)
    tag_path = PathIO.get_text_path(image_name)
    tag_path.write_text(content, encoding = "utf-8")

    return {"success": True, "path": f"datasets/{tag_path.name}"}

# ── FLUX Image ──

FLUX = FLUX_Image()

@app.post("/flux/load")
async def flux_load(model_name: str):
    try:
        FLUX.load_model(model_name)
        return {"success": True, "model": model_name}

    except Exception as error:
        raise HTTPException(status_code = 400, detail = f"Failed to initialize FLUX: {error}") from error

@app.post("/flux/close")
async def flux_close():
    try:
        FLUX.close_model()
        return {"success": True}

    except Exception as error:
        raise HTTPException(status_code = 400, detail = f"Failed to close FLUX: {error}") from error

@app.post("/flux/image")
async def flux_image(
    resolution: str, aspect_ratio: str,
    system_prompt: str, user_prompt: str, image_prompts: list[str] = Query(default=[]),
):
    if FLUX.pipeline is None:
        raise HTTPException(status_code = 400, detail = "FLUX not initialized")
    try:
        if status.get_cuda():
            status.reset_memory()
        image = await asyncio.to_thread(
            FLUX.chat_image,
            resolution, aspect_ratio,
            system_prompt, user_prompt, image_prompts, 
        )
        image_path = PathIO.get_image_path(PathIO.get_timestamp())
        ImageIO.save_image(image, image_path)
        return {"success": True, "path": f"datasets/{image_path.name}"}
    
    except Exception as error:
        raise HTTPException(status_code = 400, detail = f"Failed to chat with FLUX: {error}") from error

# ── ChatGPT Text and Image ──

@app.post("/chatgpt/text")
async def chatgpt_text(
    model_name: str,
    system_prompt: str, user_prompt: str, image_prompts: list[str] = Query(default=[]),
):
    try:
        client = ChatGPT(model_name)
        response = client.chat(system_prompt, user_prompt, image_prompts)
        return {"success": True, "text": response}
    
    except Exception as error:
        raise HTTPException(status_code = 400, detail = f"Failed to chat with ChatGPT: {error}") from error

@app.post("/chatgpt/image")
async def chatgpt_image(
    model_name: str, resolution: str, aspect_ratio: str,
    system_prompt: str, user_prompt: str, image_prompts: list[str] = Query(default=[]),
):
    try:
        client = ChatGPT_Image(model_name, resolution, aspect_ratio)
        response = client.chat_image(system_prompt, user_prompt, image_prompts)
        image_path = PathIO.get_image_path(PathIO.get_timestamp())
        ImageIO.save_image(response, image_path)
        return {"success": True, "path": f"datasets/{image_path.name}"}
    
    except Exception as error:
        raise HTTPException(status_code = 400, detail = f"Failed to chat with ChatGPT: {error}") from error

# ── Gemini Text and Image ──

@app.post("/gemini/text")
async def gemini_text(
    model_name: str,
    system_prompt: str, user_prompt: str, image_prompts: list[str] = Query(default=[]),
):
    try:
        client = Gemini(model_name)
        response = client.chat(system_prompt, user_prompt, image_prompts)
        return {"success": True, "text": response}

    except Exception as error:
        raise HTTPException(status_code = 400, detail = f"Failed to chat with Gemini: {error}") from error

@app.post("/gemini/image")
async def gemini_image(
    model_name: str, resolution: str, aspect_ratio: str,
    system_prompt: str, user_prompt: str, image_prompts: list[str] = Query(default=[]),
):
    try:
        client = Gemini_Image(model_name, resolution, aspect_ratio)
        response = client.chat_image(system_prompt, user_prompt, image_prompts)
        image_path = PathIO.get_image_path(PathIO.get_timestamp())
        ImageIO.save_image(response, image_path)
        return {"success": True, "path": f"datasets/{image_path.name}"}

    except Exception as error:
        raise HTTPException(status_code = 400, detail = f"Failed to chat with Gemini: {error}") from error

# ── Main ──

if __name__ == "__main__":
    uvicorn.run(app, host = "0.0.0.0", port = 8000, reload = True)
