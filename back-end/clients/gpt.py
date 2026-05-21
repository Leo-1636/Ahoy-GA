from langchain_openai import ChatOpenAI

from config import ApiKeys
from runtime.messages import Messages, ImageConfig

class ChatGPT:
    def __init__(self, model_name: str):
        self.model = ChatOpenAI(
            model = model_name,
            temperature = 1.0,

            api_key = ApiKeys.openai,
        )

    def chat(self, system_prompt: str, user_prompt: str, image_prompts: list):
        message = Messages()
        message.add_system(system_prompt)
        message.add_human(user_prompt)
        message.add_images(image_prompts)

        response = self.model.invoke(message.prompts)
        return response.content

class ChatGPT_Image:
    def __init__(self, model_name: str, resolution: str, aspect_ratio: str):
        self.image_config = ImageConfig(resolution, aspect_ratio)

        self.model = ChatOpenAI(
            model = model_name,
            temperature = 1.0,

            api_key = ApiKeys.openai,
        ).bind_tools([
            {
                "type": "image_generation", 
                "action": "generate",
                "quality": "medium",
                "size": f"{self.image_config.width}x{self.image_config.height}",
            }
        ])

    def chat_image(self, system_prompt: str, user_prompt: str, image_prompts: list):
        messages = Messages()
        messages.add_system(system_prompt)
        messages.add_human(user_prompt)
        messages.add_images(image_prompts)

        response = self.model.invoke(messages.prompts)
        image = messages.get_image(response)

        return image

