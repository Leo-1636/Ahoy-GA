import uuid
from pathlib import Path

from config.config import path as config_path


def generate_uuid() -> str:
    return str(uuid.uuid4())

def parse_path(image_path: str) -> tuple[str, str]:
    parts = image_path.split("/")
    if len(parts) != 2:
        raise ValueError("Invalid image path")
    folder, filename = parts
    if folder not in ("originals", "datasets"):
        raise ValueError("Invalid folder")
    return folder, filename


def get_image_path(folder: str, filename: str) -> Path:
    if folder == "originals":
        return config_path.original / filename
    if folder == "datasets":
        return config_path.datasets / filename
    raise ValueError("Invalid folder")


def get_txt_path(folder: str, image_filename: str) -> Path:
    name_without_ext = image_filename.rsplit(".", 1)[0]
    return get_image_path(folder, f"{name_without_ext}.txt")