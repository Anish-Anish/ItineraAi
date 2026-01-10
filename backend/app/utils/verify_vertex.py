import google.generativeai as genai
from google.generativeai import types
from google.oauth2 import service_account
import json

creds = service_account.Credentials.from_service_account_file(
    "/Users/anish/Desktop/trip/backend/sa.json",
    scopes=["https://www.googleapis.com/auth/cloud-platform"]
)

client = genai.Client(
    vertexai=True,
    project="anish-ai-planner",
    location="us-central1",
    credentials=creds
)

response = client.models.generate_content(
    model="gemini-2.5-flash-lite",
    contents="Hello"
)

print(response.text)
