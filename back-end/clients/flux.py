import torch
from diffusers import Flux2KleinPipeline

class ChatFLUX:
    def __init__(self, model: str, resolution: str, aspect_ratio: str):
        self.dtype = torch.bfloat16
        self.device = "cuda"
        self.config = image_config(resolution, aspect_ratio)

        self.pipeline = Flux2KleinPipeline.from_pretrained(
            model, 
            torch_dtype = self.dtype,
        )
        self.pipeline.enable_model_cpu_offload()
        
    def chat_image(self, system_prompt: str, user_prompt: str, image_prompts: list):

        if image_prompts != []:
            image = self.pipeline(
                prompt = f"{system_prompt} {user_prompt}",
                image = image_prompts,
                height = self.config.height,
                width = self.config.width,
                guidance_scale = 1.0,
                num_inference_steps = 4,
                generator = torch.Generator(device = self.device).manual_seed(0)
            ).images[0]
        else:
            image = self.pipeline(
                prompt = f"{system_prompt} {user_prompt}",
                height = self.config.height,
                width = self.config.width,
                guidance_scale = 1.0,
                num_inference_steps = 4,
                generator = torch.Generator(device = self.device).manual_seed(0)
            ).images[0]

        return image

class image_config:
    resolution_map = {
        "4K": 3840, "2K": 2560, "1K": 1024, "512": 512
    }
    aspect_ratio_map = {
        "1:1": (1, 1), "16:9": (16, 9), "9:16": (9, 16), "4:3": (4, 3), "3:4": (3, 4)
    }

    def __init__(self, resolution: str, aspect_ratio: str):
        self.resolution = self.resolution_map[resolution]
        self.aspect_ratio = self.aspect_ratio_map[aspect_ratio]

        self.width, self.height = self.calculate()

    def calculate(self):
        resolution = self.resolution
        width_ratio, height_ratio = self.aspect_ratio
        width = int(resolution if width_ratio >= height_ratio else resolution * width_ratio / height_ratio)
        height = int(resolution if height_ratio >= width_ratio else resolution * height_ratio / width_ratio)
        return width, height
