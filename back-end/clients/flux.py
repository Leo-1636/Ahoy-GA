import torch
from diffusers import Flux2KleinPipeline

from config.config import model

class Flux2Klein:
    def __init__(self):
        self.model_name = model.flux_2_klein_9b
        self.pipe = Flux2KleinPipeline.from_pretrained(self.model_name, torch_dtype=torch.bfloat16)
        self.pipe.enable_model_cpu_offload()
        self.device = "cuda"

flux = Flux2Klein()

def generate_image(system_prompt: str, user_prompt: str, images: list) -> None:
    prompt = f"{system_prompt} {user_prompt}"
    image = images[0]
    return flux.pipe(
        prompt,
        image = image,
        height = 2160,
        width = 3840,
        guidance_scale = 1.0,
        num_inference_steps = 4,
        generator = torch.Generator(device=flux.device).manual_seed(0)
    ).images[0]
