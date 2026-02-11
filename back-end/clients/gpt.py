import os
from dotenv import load_dotenv
load_dotenv()

from langchain_openai import ChatOpenAI as ChatGPT

from config.config import model
from utils.messages import Messages

gpt = ChatGPT(
    model = model.gpt5,

    temperature = 0.0,
    api_key = os.getenv("OPENAI_API_KEY"),
)

def generate_text(system_prompt: str, user_prompt: str, image) -> str:
    messages = Messages()
    messages.add_system(system_prompt)
    messages.add_human(user_prompt)
    messages.add_image(image)
    return gpt.invoke(messages.messages).content