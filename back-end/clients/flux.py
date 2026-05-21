import torch
from diffusers import Flux2KleinPipeline

from runtime.messages import ImageConfig

class FLUX_Image:
    def __init__(self):
        self.pipeline = None

    def load_model(self, model_name: str):
        self.close_model()
        self.pipeline = Flux2KleinPipeline.from_pretrained(
            model_name,
            torch_dtype = torch.bfloat16,
        )
        self.pipeline.enable_model_cpu_offload()

    def close_model(self):
        if self.pipeline is None:
            return
        del self.pipeline
        self.pipeline = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()

    def chat_image(self,
        resolution: str, aspect_ratio: str,
        system_prompt: str, user_prompt: str, image_prompts: list,
    ):
        self.config = ImageConfig(resolution, aspect_ratio)
        image = self.pipeline(
            prompt              = f"{system_prompt} {user_prompt}",
            height              = self.config.height,
            width               = self.config.width,
            guidance_scale      = 1.0,
            num_inference_steps = 8,
            generator           = torch.Generator(device = "cuda").manual_seed(0),
            **({"image": image_prompts} if image_prompts else {}),
        ).images[0]

        return image

    
