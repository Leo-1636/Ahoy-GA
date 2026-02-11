import base64
import io
import math
from pathlib import Path

from PIL import Image, ImageDraw

def to_bytes(image: Image.Image) -> bytes:
    image_bytes = io.BytesIO()
    image.save(image_bytes, format="PNG")
    return image_bytes.getvalue()

def to_base64(image: Image.Image) -> str:
    return base64.b64encode(to_bytes(image)).decode('utf-8')

def open_image(image_path: str) -> Image.Image:
    return Image.open(image_path)

def open_bytes(bytes: bytes) -> Image.Image:
    return Image.open(io.BytesIO(bytes))
    
def open_base64(base64_str: str) -> Image.Image:
    return Image.open(io.BytesIO(base64.b64decode(base64_str)))

def save_image(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(str(path), format="PNG")

def draw_arrow(
    image: Image.Image,
    start_x: int,
    start_y: int,
    end_x: int,
    end_y: int,
) -> Image.Image:
    image = image.convert("RGBA")
    draw = ImageDraw.Draw(image)

    start, end = (start_x, start_y), (end_x, end_y)
    line_width = max(3, min(image.width, image.height) // 150)
    arrow_color = (255, 0, 0, 255)

    draw.line([start, end], fill=arrow_color, width=line_width)
    dx, dy = end[0] - start[0], end[1] - start[1]
    arrow_length = max(15, min(image.width, image.height) // 30)
    angle, arrow_angle = math.atan2(dy, dx), math.pi / 6

    left_x, left_y = end[0] - arrow_length * math.cos(angle - arrow_angle), end[1] - arrow_length * math.sin(angle - arrow_angle)
    right_x, right_y = end[0] - arrow_length * math.cos(angle + arrow_angle), end[1] - arrow_length * math.sin(angle + arrow_angle)
    draw.polygon([end, (left_x, left_y), (right_x, right_y)], fill = arrow_color)
    return image

