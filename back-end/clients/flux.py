import os, sys

from transformers.models.idefics.processing_idefics import image_attention_mask_for_packed_input_ids
if sys.platform == "linux":
    if os.environ.get("LD_LIBRARY_PATH"):
        del os.environ["LD_LIBRARY_PATH"]
        os.execv(sys.executable, [sys.executable] + sys.argv)

import torch
from diffusers import Flux2KleinPipeline as FluxPipeline

from config.config import model, path
from utils import system_util
from utils.image_util import save_image

class Flux2Klein:
    def __init__(self):
        self.dtype = torch.bfloat16
        self.device = "cuda"
        self.vram_limit = 20 * (1024**3) # 20GB

        if torch.cuda.is_available():
            vram_bytes = torch.cuda.get_device_properties(0).total_memory
            if vram_bytes > self.vram_limit:
                self.pipeline = FluxPipeline.from_pretrained(model.flux_2_klein_9b, torch_dtype=self.dtype)
        else:
            self.pipeline = FluxPipeline.from_pretrained(model.flux_2_klein_4b, torch_dtype=self.dtype)
        self.pipeline.enable_model_cpu_offload()

flux_klein = Flux2Klein()

def generate_image(system_prompt: str, user_prompt: str, images: list) -> None:
    prompt = f"system: {system_prompt} user: {user_prompt}"
    image = flux_klein.pipeline(
        prompt = prompt,
        image = images,
        height = 1440,
        width = 2560,
        guidance_scale = 1.0,
        num_inference_steps = 4,
        generator = torch.Generator(device = flux_klein.device).manual_seed(0)
    ).images[0]

    save_image(
        image = image,
        path = path.original / f"{system_util.generate_uuid()}.png"
    )
    return image
