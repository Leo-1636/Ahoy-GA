from langchain_openai import ChatOpenAI

from config import api_key
from clients.message import Message

class ChatGPT:
    def __init__(self, model: str):
        self.model = ChatOpenAI(
            model = model,
            temperature = 1.0,

            api_key = api_key.chatgpt,
        )

    def chat_text(self, system_prompt: str, user_prompt: str, image_prompt: list):
        message = Message()
        message.add_system(system_prompt)
        message.add_human(user_prompt)
        message.add_images(image_prompt)

        return self.model.invoke(message.prompts).content
