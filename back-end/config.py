from pathlib import Path
from dotenv import get_key, set_key

class Paths:
    workspace = Path.cwd() / "workspace"
    environment = Path.cwd() / ".env"

    original  = Path(workspace) / "original"
    datasets  = Path(workspace) / "datasets"

class ApiKeys:
    openai = get_key(Paths.environment, "OPENAI_API_KEY")
    google = get_key(Paths.environment, "GOOGLE_API_KEY")

    @staticmethod
    def set(name: str, key: str):
        set_key(Paths.environment, name, key)

class Models:
    gpt_5_4_mini    = "gpt-5.4-mini"
    gemini_3_flash  = "gemini-3-flash-preview"

    gpt_image_2     = "gpt-image-2"
    nano_banana_pro = "gemini-3-pro-image-preview"
    nano_banana_2   = "gemini-3.1-flash-image-preview"

    flux2_klein_4b  = "black-forest-labs/FLUX.2-klein-4B"
    flux2_klein_9b  = "black-forest-labs/FLUX.2-klein-9B"
