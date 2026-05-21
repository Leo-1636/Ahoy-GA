from langchain_google_genai import  ChatGoogleGenerativeAI

from config import ApiKeys
from runtime.messages import Messages

class Gemini:
    def __init__(self, model_name: str):
        self.model = ChatGoogleGenerativeAI(
            model = model_name,
            temperature = 1.0,

            api_key = ApiKeys.google,
        )

    def chat(self, system_prompt: str, user_prompt: str, image_prompts: list):
        messages = Messages()
        messages.add_system(system_prompt)
        messages.add_human(user_prompt)
        messages.add_images(image_prompts)

        response = self.model.invoke(messages.prompts)
        return response.content

class Gemini_Image:
    def __init__(self, model_name: str, resolution: str, aspect_ratio: str):
        self.model = ChatGoogleGenerativeAI(
            model = model_name,
            temperature = 1.0,

            image_config = {
                "image_size": resolution,
                "aspect_ratio": aspect_ratio,
            },
            api_key = ApiKeys.google,
        ).bind_tools([{"google_search": {}}])
    
    def chat_image(self, system_prompt: str, user_prompt: str, image_prompts: list):
        messages = Messages()
        messages.add_system(system_prompt)
        messages.add_human(user_prompt)
        messages.add_images(image_prompts)

        response = self.model.invoke(messages.prompts)
        image = messages.get_image(response)

        return image
