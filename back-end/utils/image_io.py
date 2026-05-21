import base64
import io
import math
from pathlib import Path
from typing import Union

from PIL import Image, ImageDraw, ImageColor

class ImageIO:
    def __init__(self):
        self.buffer = io.BytesIO()

    @staticmethod
    def open_image(path: Union[str, Path]) -> Image.Image:
        return Image.open(path)

    @staticmethod
    def open_bytes(bytes: bytes) -> Image.Image:
        return ImageIO.open_image(io.BytesIO(bytes))
    
    @staticmethod
    def open_base64(base64_code: str) -> Image.Image:
        return ImageIO.open_bytes(base64.b64decode(base64_code))
    
    @staticmethod
    def to_bytes(image: Image.Image) -> bytes:
        image.save(ImageIO.buffer, format="PNG")
        return ImageIO.buffer.getvalue()

    @staticmethod
    def to_base64(image: Image.Image) -> str:
        return base64.b64encode(ImageIO.to_bytes(image)).decode('utf-8')

    @staticmethod
    def save_image(image: Image.Image, path: Path) -> None:
        path.parent.mkdir(parents = True, exist_ok = True)
        image.save(str(path), format = "PNG")

    @staticmethod
    def crop_image(image: Image.Image, x: int, y: int, width: int, height: int) -> Image.Image:
        return image.crop((x, y, x + width, y + height))

    @staticmethod
    def draw_arrow(image: Image.Image, start_x: int, start_y: int, end_x: int, end_y: int, color: str) -> Image.Image:
        image = image.convert("RGBA")
        draw = ImageDraw.Draw(image)

        start, end = (start_x, start_y), (end_x, end_y)
        line_width = max(3, min(image.width, image.height) // 150)
        arrow_color = ImageColor.getcolor(color, "RGBA")
        
        draw.line([start, end], fill = arrow_color, width = line_width)
        delta_x, delta_y = end[0] - start[0], end[1] - start[1]
        arrow_length = max(15, min(image.width, image.height) // 30)
        angle, arrow_angle = math.atan2(delta_y, delta_x), (math.pi / 6)

        left_x = end[0] - arrow_length * math.cos(angle - arrow_angle)
        left_y = end[1] - arrow_length * math.sin(angle - arrow_angle)
        right_x = end[0] - arrow_length * math.cos(angle + arrow_angle)
        right_y = end[1] - arrow_length * math.sin(angle + arrow_angle)

        draw.polygon([end, (left_x, left_y), (right_x, right_y)], fill = arrow_color)
        return image

