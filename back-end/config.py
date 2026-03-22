from pathlib import Path

class api_key:
    gemini = None
    chatgpt = None

class root_path:
    storage  = Path(__file__).parent.parent / "storage"
    original = storage / "original"
    datasets = storage / "datasets"

class llm_model:
    gpt5          = "gpt-5.4-2026-03-05"
    gpt5_mini     = "gpt-5.4-mini-2026-03-17"
    gemini3_flash = "gemini-3-flash-preview"

class image_model:
    nano_banana_pro = "gemini-3-pro-image-preview"
    nano_banana_2   = "gemini-3.1-flash-image-preview"

    flux2_klein_4b = "black-forest-labs/FLUX.2-klein-4B"
    flux2_klein_9b = "black-forest-labs/FLUX.2-klein-9B"

def set_api_key(gemini: str, chatgpt: str):
    api_key.gemini  = gemini
    api_key.chatgpt = chatgpt
