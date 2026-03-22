import uuid
from pathlib import Path

from config import root_path

def generate_uuid() -> str:
    return str(uuid.uuid4())

def to_path(path: str) -> Path:
    return root_path.storage / path

def to_txt_path(image_path: str) -> Path:
    return to_path(image_path).with_suffix(".txt")
