import torch
from diffusers import AutoModel, DiffusionPipeline, TorchAoConfig

from config.config import model

class QwenImageEdit:
    def __init__(self):
        model_id = model.qwen_image_edit
        torch_dtype = torch.bfloat16
        quantization_config = TorchAoConfig("int8wo")

        transformer = AutoModel.from_pretrained(
            model_id, 
            subfolder = "transformer", 
            torch_dtype = torch_dtype,
            quantization_config = quantization_config
        )
        self.pipeline = DiffusionPipeline.from_pretrained(
            model_id,
            transformer = transformer,
            torch_dtype = torch_dtype,
        )
        self.pipeline.enable_model_cpu_offload()

qwen_image = QwenImageEdit()

def generate_image(system_prompt: str, user_prompt: str, images: list) -> None:
    prompt = f"{system_prompt} {user_prompt}"
    return qwen_image.pipeline(
        prompt,
        image = images,
        height = 2160,
        width = 3840,
        guidance_scale = 1.0,
        num_inference_steps = 4,
    ).images[0]
