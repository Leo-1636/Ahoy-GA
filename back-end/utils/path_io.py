import uuid
from datetime import datetime

from pathlib import Path

from config import Paths

class PathIO:
    @staticmethod
    def get_uuid() -> str:
        return str(uuid.uuid4())

    @staticmethod
    def get_timestamp() -> str:
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def get_stem(path: str) -> str:
        return str(Path(path).stem)

    @staticmethod
    def get_name(path: str) -> str:
        return str(Path(path).name)

    @staticmethod
    def get_path(path: str) -> Path:
        return Paths.workspace / path

    @staticmethod
    def get_original(path: str) -> Path:
        return Paths.original / path

    @staticmethod
    def get_text_path(name: str) -> Path:
        return Paths.datasets / f"{name}.txt"

    @staticmethod
    def get_image_path(name: str) -> Path:
        return Paths.datasets / f"{name}.png"
