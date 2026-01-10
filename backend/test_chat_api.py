from pydantic import BaseModel
from typing import List, Optional, Dict, Tuple
import random

import google.generativeai as genai
from google.generativeai import types
from google.oauth2 import service_account

import aiohttp
from aiohttp import ClientTimeout
import httpx

import json
import time
import math
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

# -------------------------
# CONFIG
# -------------------------
PER_KM_COST = 15
MAX_TRAVEL_DISTANCE_PER_SPOT = 150
MAX_DAILY_TRAVEL_MIN = 480

SERVICE_ACCOUNT_PATH = os.getenv("SERVICE_ACCOUNT_PATH")
VERTEX_PROJECT = os.getenv("VERTEX_PROJECT")
VERTEX_LOCATION = os.getenv("VERTEX_LOCATION")
MODEL_ID = os.getenv("MODEL_ID_PLANNER") or "gemini-2.5-flash-lite"

SCOPES = os.getenv("SCOPES").split(",") if os.getenv("SCOPES") else []

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

OUTPUT_FILE = "fast_output.json"

MODEL_ID = "gemini-2.5-flash-lite"

# -------------------------
# Gemini Configuration  (instead of genai.Client())
# -------------------------
genai.configure(api_key=GOOGLE_API_KEY)

# -------------------------
# Pydantic model
# -------------------------
class TripDetails(BaseModel):
    origin: Optional[str] = None
    destination: str
    duration_days: Optional[int] = None
    start_date: Optional[str] = None
    travelers: Optional[int] = 1
    budget: Optional[int] = None
    place_category: Optional[str] = None
    interests: List[str]
    search_keywords: Dict[str, str] = {
        "primary": "",
        "secondary": "",
        "extra": "",
    }
    search_radius_km: int = 75
    max_spots: int = 1


# -------------------------
# STEP 1 – Structured intent
# -------------------------
def get_structured_trip_details(user_prompt: str) -> Optional[TripDetails]:

    system_instruction = """
    You are an expert travel planner assistant. Convert the user's text into structured JSON only.
    STRICT JSON ONLY.
    """

    try:
        response = genai.generate_content(
            model=MODEL_ID,
            contents=user_prompt,
            generation_config=types.GenerationConfig(
                response_mime_type="application/json",
                max_output_tokens=4000,
                temperature=0.7,
            )
        )

        parsed_data = json.loads(response.text)
        return TripDetails.model_validate(parsed_data)

    except Exception as e:
        print(f"Error: {e}")
        return None
