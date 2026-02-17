from pathlib import Path

class path:
    storage = Path("storage")
    original = storage / "originals"
    datasets = storage / "datasets"

class model:
    gpt5 = "gpt-5.2-2025-12-11"
    gpt5_pro = "gpt-5.2-pro-2025-12-11"
    gemini_3_pro = "gemini-3-pro-preview"
    gemini_3_flash = "gemini-3-flash-preview"
    gemini_3_image = "gemini-3-pro-image-preview"
    flux_2_klein_4b = "black-forest-labs/FLUX.2-klein-4B"
    flux_2_klein_9b = "black-forest-labs/FLUX.2-klein-9B"
