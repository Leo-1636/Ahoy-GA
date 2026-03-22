from PIL import Image
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from utils import image_util

class Message:
    def __init__(self):
        self.prompts = []

    def add_system(self, content: str):
        self.prompts.append(SystemMessage(content = content))

    def add_human(self, content: str):
        self.prompts.append(HumanMessage(content = content))

    def add_images(self, images: Image.Image | list[Image.Image]):
        images = images if isinstance(images, list) else [images]

        content_list = [
            {
                "type": "image",
                "base64": image_util.to_base64(image),
                "mime_type": "image/png",
            }
            for image in images
        ]
        self.prompts.append(HumanMessage(content = content_list))

    def get_images(self, message: AIMessage | HumanMessage) -> None:
        image_block = next(
            block
            for block in message.content
            if isinstance(block, dict) and block.get("image_url")
        )
        return image_util.open_base64(image_block["image_url"].get("url").split(",")[-1])

