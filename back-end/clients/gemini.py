import os
from dotenv import load_dotenv
load_dotenv()

from langchain_google_genai import  ChatGoogleGenerativeAI as ChatGemini

from config.config import model, path
from utils import system_util
from utils.image_util import save_image
from utils.messages import Messages

gemini_image = ChatGemini(
    model = model.gemini_3_image,

    temperature = 0.0,
    image_config = {
        "image_size": "4K",
        "aspect_ratio": "16:9", 
    },
    
    api_key = os.getenv("GOOGLE_API_KEY"),
)
gemini_image.bind_tools([{"google_search": {}}])

def gereate_image(system_prompt: str, user_prompt: str, images: list) -> None:
    messages = Messages()
    messages.add_system(system_prompt)
    messages.add_human(user_prompt)
    for image in images:
        messages.add_image(image)
    image = messages.get_images(gemini_image.invoke(messages.messages))
    save_image(
        image = image,
        path = path.original / f"{system_util.generate_uuid()}.png"
    )
    return image

