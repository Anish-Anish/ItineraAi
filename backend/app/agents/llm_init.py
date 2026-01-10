from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_vertexai import ChatVertexAI
import os

def get_llm():
    return ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.0, api_key=os.getenv("GOOGLE_API_KEY"))

def get_llm2_0():
    return ChatVertexAI(
        model="gemini-2.0-flash",
        project="anish-ai-planner",
        location="us-central1"
    )








