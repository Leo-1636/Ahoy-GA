from PIL import Image
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from utils import image_util

class Messages:
    def __init__(self):
        self.messages = []

    def add_system(self, content: str) -> None:
        self.messages.append(SystemMessage(content=content))

    def add_human(self, content: str) -> None:
        self.messages.append(HumanMessage(content=content))

    def add_image(self, image: Image.Image) -> None:
        self.messages.append(
            HumanMessage(
                 content=[
                    {
                        "type": "image",
                        "base64": image_util.to_base64(image),
                        "mime_type": "image/png",
                    },
                ]
            )
        )

    def get_images(self, message: AIMessage | HumanMessage) -> None:
        image_block = next(
            block
            for block in message.content
            if isinstance(block, dict) and block.get("image_url")
        )
        return image_util.open_base64(image_block["image_url"].get("url").split(",")[-1])

