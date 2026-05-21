from PIL import Image
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from utils.image_io import ImageIO

class Messages:
    def __init__(self):
        self.prompts = []

    def add_system(self, content: str):
        self.prompts.append(SystemMessage(content = content))

    def add_human(self, content: str):
        self.prompts.append(HumanMessage(content = content))

    def add_images(self, images: Image.Image | list[Image.Image]):
        self.prompts.append(
            HumanMessage(content = 
                [
                    {
                        "type": "image",
                        "base64": ImageIO.to_base64(image),
                        "mime_type": "image/png",
                    }
                    for image in (images if isinstance(images, list) else [images])
                ]
            )
        )

    def get_image(self, message: AIMessage | HumanMessage) -> str:
        image = next(
            block for block in message.content_blocks 
            if block["type"] == "image"
        )
        return ImageIO.open_base64(image["base64"])

class ImageConfig:
    def __init__(self, resolution: str, aspect_ratio: str):
        self.resolution = self.resolution[resolution]
        self.aspect_ratio = self.aspect_ratio[aspect_ratio]
        self.width, self.height = self.resolution[self.aspect_ratio]

    aspect_ratio = {
        "1:1" : 0, "4:3" : 1, "3:4" : 2, "16:9" : 3, "9:16" : 4
    }
    resolution = {
        "1K" : [(1024, 1024), (1024, 768), (768, 1024), (1024, 576), (576, 1024)],
        "2K" : [(2048, 2048), (2048, 1536), (1536, 2048), (2048, 1152), (1152, 2048)],
        "4K" : [(3840, 3840), (3840, 2880), (2880, 3840), (3840, 2160), (2160, 3840)],
    }
