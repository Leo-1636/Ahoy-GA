from langchain_google_genai import  ChatGoogleGenerativeAI

from config import api_key
from clients.message import Message

class ChatGemini:
    def __init__(self, model: str, resolution: str, aspect_ratio: str):
        self.model = ChatGoogleGenerativeAI(
            model = model,
            temperature = 1.0,

            image_config = {
                "image_size": resolution,
                "aspect_ratio": aspect_ratio,
            },
            api_key = api_key.gemini,
        )
        self.model.bind_tools([{"google_search": {}}])

    def chat_image(self, system_prompt: str, user_prompt: str, image_prompts: list):
        message = Message()
        message.add_system(system_prompt)
        message.add_human(user_prompt)
        message.add_images(image_prompts)

        response = self.model.invoke(message.prompts)
        image = message.get_images(response)
        
        return image
