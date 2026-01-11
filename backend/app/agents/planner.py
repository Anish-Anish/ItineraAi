from pydantic import BaseModel
from typing import List, Optional, Dict, Tuple
import random
# from google import genai
# from google import genai
# import google.generativeai as genai
# from google.genai import types
# from google.generativeai import types
from google import genai
from google.genai import types
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
from datetime import datetime
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
GOOGLE_API_KEY = GOOGLE_MAPS_API_KEY
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

OUTPUT_FILE = "fast_output.json"

# MODEL_ID = "gemini-2.5-pro"
# MODEL_ID = "gemini-2.5-flash"
MODEL_ID = "gemini-2.5-flash-lite"


# -------------------------
# CLIENTS
# -------------------------
_credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_PATH, scopes=SCOPES
)

_client = genai.Client(
    vertexai=True,
    project=VERTEX_PROJECT,
    location=VERTEX_LOCATION,
    credentials=_credentials,
)


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
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"Error: Service account not found: {SERVICE_ACCOUNT_PATH}")
        return None

    try:

        client = genai.Client(
            vertexai=True,
            project=VERTEX_PROJECT,
            location=VERTEX_LOCATION,
            credentials=_credentials,
        )

        system_instruction = f"""
        You are an expert travel planner assistant. Convert the user's text into **strict JSON only**.
        
        Follow these rules:
        
        • **origin**: extract the city the user is traveling from. If absent → null.  
        • **destination**: main city, state, or country.  
        • **duration_days**: number of days. If missing → infer 3.  
        • **start_date**:  
            - If an exact date appears → extract in ISO YYYY-MM-DD.  
            - If only a month name appears → use the 1st of that month.  
            - If no date is given → use: {datetime.now().date().isoformat()}  
        • **travelers**: extract number of people. If missing → 1.  
        • **budget**: extract numeric amount only (INR). If missing → null.  
        • **place_category**: derive from interests → 'mountain', 'beach', 'nature', 'waterfalls', etc.  
        • **interests**: extract interest nouns.  
        • **search_keywords**:  
            - Generate 1–10 keyword groups based on the trip type.  
            - Use diverse themes such as: Cultural Explorer, Adventure Seeker, Relaxation Retreat,  
              Food & Nightlife, Nature Lover, History Buff, Wildlife Explorer, Spiritual Journey.  
            - Place them under keys: primary, secondary, extra1, extra2, ...  
        • **search_radius_km**: always default to 75.  
        • **max_spots**: always set to 21.  
        
        STRICT REQUIREMENTS:  
        - Do NOT add any extra fields.  
        - Output must be **pure JSON**, no explanations.  
        
        Return JSON in this exact schema:
        
        {{
          "origin": "string|null",
          "destination": "string",
          "duration_days": number,
          "start_date": "string|null",
          "travelers": number,
          "budget": number|null,
          "place_category": "string|null",
          "interests": [string],
          "search_keywords": {{
              "primary": "string",
              "secondary": "string",
              "extra": "string"
          }},
          "search_radius_km": number,
          "max_spots": number
        }}
        """

        response = client.models.generate_content(
            model=MODEL_ID,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_schema=TripDetails,
                response_mime_type="application/json",
            ),
        )

        parsed_data = json.loads(response.text)
        return TripDetails.model_validate(parsed_data)

    except Exception as e:
        print(f"Error: {e}")
        return None


# -------------------------
# STEP 2 – Places search (optimized)
# -------------------------
MIN_RATING = 3.5


async def fetch_json(session, url, params):
    async with session.get(url, params=params) as response:
        return await response.json()


async def places_text_search(session, query, location):

    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {"query": f"{query} in {location}", "key": GOOGLE_API_KEY}
    data = await fetch_json(session, url, params)
    # Limit per query to top 10 results to cap load
    return data.get("results", [])[:10]


def fetch_spot_data_from_text(place):
    return {
        "id": place.get("place_id"),
        "name": place.get("name"),
        "lat": place.get("geometry", {}).get("location", {}).get("lat"),
        "lng": place.get("geometry", {}).get("location", {}).get("lng"),
        "rating": place.get("rating", None),
        "types": place.get("types", []),
        "open_now": place.get("opening_hours", {}).get("open_now", None),
    }


def select_central_hotel_location(spots):
    if not spots:
        return {"lat": None, "lng": None}
    return random.choice(spots)


async def run_step2(input_data: Dict) -> Dict:
    destination = input_data.get("destination")
    max_spots_required = input_data.get("max_spots") + 3
    keywords = input_data.get("search_keywords", {})


    raw_keywords = [kw for kw in keywords.values() if kw]
    raw_keywords = raw_keywords[:10]

    search_queries = [f"{kw} top attractions in {destination}" for kw in raw_keywords]

    all_spots = []

    async with aiohttp.ClientSession() as session:

        for query in search_queries:

            results = await places_text_search(session, query, destination)

            for r in results:
                if (
                        r.get("rating", 0) >= MIN_RATING
                        and r.get("geometry", {}).get("location")
                ):
                    all_spots.append(fetch_spot_data_from_text(r))

            if len(all_spots) >= max_spots_required:
                break

    unique_spots = list({spot["id"]: spot for spot in all_spots}.values())
    final_spots = unique_spots[:max_spots_required]

    if len(final_spots) == 0:
        return {
            "error": "NO_SPOTS_FOUND",
            "message": f"No spots found for destination '{destination}'",

        }

    return {
        "spots": final_spots,
        "hotel_location": select_central_hotel_location(final_spots),

    }



# -------------------------
# Distance helpers
# -------------------------
async def build_distance_matrix_async(
    origins: List[Tuple[float, float]], destinations: List[Tuple[float, float]]
) -> Dict:

    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    origin_str = "|".join([f"{lat},{lng}" for lat, lng in origins])
    dest_str = "|".join([f"{lat},{lng}" for lat, lng in destinations])
    params = {
        "origins": origin_str,
        "destinations": dest_str,
        "key": GOOGLE_MAPS_API_KEY,
        "units": "metric",
    }

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        return response.json()


def estimate_travel_cost(distance_km: float) -> int:
    return int(distance_km * PER_KM_COST)


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    return 2 * R * math.asin(math.sqrt(a))


def build_local_spot_to_spot_matrix(spots: List[Dict]) -> Dict[str, Dict[str, Dict[str, float]]]:
    AVG_SPEED_KMPH = 35
    matrix: Dict[str, Dict[str, Dict[str, float]]] = {}

    for i, s1 in enumerate(spots):
        s1_name = s1["name"]
        matrix[s1_name] = {}
        lat1, lng1 = s1["lat"], s1["lng"]

        for j, s2 in enumerate(spots):
            if i == j:
                continue
            lat2, lng2 = s2["lat"], s2["lng"]
            dist_km = haversine_km(lat1, lng1, lat2, lng2)
            time_min = (dist_km / AVG_SPEED_KMPH) * 60 if AVG_SPEED_KMPH > 0 else 0
            matrix[s1_name][s2["name"]] = {
                "distance_km": round(dist_km, 1),
                "time_min": round(time_min, 1),
            }

    return matrix


# -------------------------
# STEP 3 – Distance + cost (optimized)
# -------------------------
async def process_spots(step2_data: Dict) -> Dict:
    """Processes hotel–spot and spot–spot distance features (few API calls)."""

    if "error" in step2_data:
        return step2_data

    start_total = time.time()

    hotel = step2_data["hotel_location"]
    spots = step2_data["spots"]

    origins = [(hotel["lat"], hotel["lng"])]
    destinations = [(s["lat"], s["lng"]) for s in spots]

    print("\n🚀 STEP 3.1: Distance Matrix for Hotel ➜ Spots...")
    start_hotel_to_spots = time.time()

    dm_response = await build_distance_matrix_async(origins, destinations)

    hotel_to_spots_time = round(time.time() - start_hotel_to_spots, 2)

    results = []
    budget_used = 0

    for i, row in enumerate(dm_response["rows"][0]["elements"]):
        spot = spots[i]
        if row["status"] != "OK":
            continue

        dist_km = round(row["distance"]["value"] / 1000, 2)
        time_min = round(row["duration"]["value"] / 60, 1)

        if dist_km > MAX_TRAVEL_DISTANCE_PER_SPOT:
            continue

        travel_cost = estimate_travel_cost(dist_km)
        budget_used += travel_cost

        results.append(
            {
                "name": spot["name"],
                "distance_from_hotel_km": dist_km,
                "travel_time_min": time_min,
                "travel_cost": travel_cost,
                "entry_fee": spot.get("entry_fee", 0),
                "lat": spot["lat"],
                "lng": spot["lng"],
            }
        )

    print(f"✅ Hotel ➜ Spots completed in {hotel_to_spots_time}s")

    print("\n🌍 STEP 3.2: Local Spot ➜ Spot matrix (no API)...")
    start_spot_to_spot = time.time()

    filtered_spots = [
        {"name": r["name"], "lat": r["lat"], "lng": r["lng"]} for r in results
    ]

    pair_matrix = build_local_spot_to_spot_matrix(filtered_spots)

    spot_to_spot_time = round(time.time() - start_spot_to_spot, 2)
    total_time = round(time.time() - start_total, 2)

    print(f"✅ Spot ➜ Spot (local) completed in {spot_to_spot_time}s")
    print(f"\n⏱️ TOTAL Step 3 processing time: {total_time}s")

    return {
        "spots_distance_features": results,
        "distance_matrix": pair_matrix,
        "budget_used_so_far": budget_used,
        "travel_constraints": {"max_daily_travel_min": MAX_DAILY_TRAVEL_MIN},
        "time_taken": {
            "hotel_to_spots_sec": hotel_to_spots_time,
            "spot_to_spot_sec": spot_to_spot_time,
            "total_step3_sec": total_time,
        },
    }


# ===========================
# JSON Auto Fixer
# ===========================
def fix_broken_json(bad_json: str) -> dict:
    """Repair malformed or truncated JSON using Gemini safely."""
    print("⚙️ Attempting to auto-fix malformed JSON...")

    cleaned_json = bad_json.strip()
    if cleaned_json.startswith("```json") and cleaned_json.endswith("```"):
        cleaned_json = cleaned_json[7:-3].strip()
    elif cleaned_json.startswith("```") and cleaned_json.endswith("```"):
        cleaned_json = cleaned_json[3:-3].strip()

    repair_prompt = f"""
    The following JSON is invalid or incomplete and may contain markdown formatting.
    Your job is to:
    1. Remove any markdown code blocks (```json or ```)
    2. Fix structural issues (missing commas, brackets, quotes)
    3. Ensure all strings are properly quoted
    4. Do NOT change or reword any field values
    5. Return strictly valid JSON without any markdown formatting or comments

    JSON to fix:
    {cleaned_json}
    """

    repair_config = types.GenerateContentConfig(
        max_output_tokens=24000,
        response_mime_type="application/json",
        temperature=0.0,
    )
    repair_response = _client.models.generate_content(
        model=MODEL_ID,
        contents=repair_prompt,
        config=repair_config,
    )
    fixed_text = repair_response.text.strip()

    try:
        return json.loads(fixed_text)
    except Exception:
        print("❌ Auto-fix attempt failed. Returning raw output.")
        return {"error": "Invalid JSON even after fix", "raw_text": fixed_text}


# ===========================
# Day plan optimizer (hotel ➜ spots using local matrix)
# ===========================
def optimize_day_plan(step2_data: Dict, step3_data: Dict) -> Dict:
    start_time = time.time()

    hotel = step2_data["hotel_location"]
    spots = step3_data["spots_distance_features"]
    distance_matrix = step3_data["distance_matrix"]
    max_daily_travel_min = step3_data["travel_constraints"]["max_daily_travel_min"]

    spots.sort(key=lambda x: x["distance_from_hotel_km"])

    days_output: Dict[str, List[Dict]] = {}
    current_day = 1
    remaining_spots = spots[:]
    precomputed = {loc: distance_matrix.get(loc, {}) for loc in distance_matrix}

    while remaining_spots:
        day_key = f"Day {current_day}"
        days_output[day_key] = []
        travel_used = 0
        current_loc = "hotel"

        while remaining_spots:
            if current_loc == "hotel":
                next_spot = remaining_spots[0]
                travel_time = next_spot["travel_time_min"]
            else:
                lookup = precomputed.get(current_loc, {})
                next_spot = min(
                    remaining_spots,
                    key=lambda s: lookup.get(s["name"], {}).get("time_min", 999999),
                )
                travel_time = lookup.get(next_spot["name"], {}).get("time_min", 0)

            if travel_used + travel_time > max_daily_travel_min:
                break

            travel_used += travel_time
            days_output[day_key].append(
                {"name": next_spot["name"], "lat": next_spot["lat"], "lng": next_spot["lng"]}
            )
            current_loc = next_spot["name"]
            remaining_spots.remove(next_spot)

        current_day += 1

    days_output["hotel_location"] = hotel
    print(f"⏱ optimize_day_plan done in {time.time() - start_time:.2f} sec")
    return days_output


# ===========================
# STEP 3 → 4 – LLM itinerary formatter
# ===========================
def format_itinerary_with_llm(itinerary_data, user_query):
    start_time = time.time()

    prompt = f"""
    You are a professional travel planner.

    TASK: Create **three unique trip plans** for the user's query below.
    Each plan must include a different set of places (no repeated spot across plans).

    IMPORTANT:
    - Use the spots given in the JSON below as the primary pool.
    - You MAY add a few extra nearby spots if needed, but try to reuse given spots.
    - The order of spots within each day in the JSON is already optimized for distance.
      Try to follow that order as much as possible.

    Follow these steps strictly:
    1️⃣ Group nearby spots on the same day to minimize travel.
    2️⃣ Start each day near the hotel and pick user-requested or nearby places.
    3️⃣ Allocate realistic durations (1–2h for small spots, 3–5h for beaches, etc).
    4️⃣ Each plan must be a **valid JSON object** matching the schema below.
    5️⃣ Output an array containing 3 such plans — `[plan1, plan2, plan3]`.

    ⚙️ SCHEMA for each plan:
    {{
        "date":"YYYY-MM-DD",
        "duration_days":int,
        "itinerary_name": "2-3 word catchy itinerary name",
        "hotel":{{
            "name": "Uv Bar",
            "lat": 15.5793064,
            "lng": 73.7388843,
            "rating": 3.9,
            "types": [
                "bar",
                "establishment",
                "night_club",
                "point_of_interest"
            ],
            "open_now": true
        }},
        "itinerary":{{
            "Day 1":[{{
                "spot_name": "Dream Beach",
                "lat": 15.0,
                "long": 73.9,
                "description": "very crisp description",
                "estimated_time_spent": "2 hours",
            }},
            {{
                "spot_name": "Goosebumps Virtual Escape",
                "lat": 15.1,
                "long": 73.95,
                "description": "very crisp description",
                "estimated_time_spent": "1.5 hours",
            }}],
            "Day 2":[ ... ],
            "Day n":[ ... ]
        }}
    }}

    📏 RULES:
    - If the user mentions a number of days, plan **exactly that many days** (Day 1 … Day N).
    - If not mentioned, default to **3 days**.
    - Each day must have **at least 3 activities** (morning, afternoon, evening) when possible.
    - Each description should be **short (7–8 words max)**.
    - Each plan should have **unique spots**, no overlap between plans.
    - Use at least two of the given places whenever possible. For the remaining spots, you may use your internal knowledge with accurate latitude/longitude.
    - The total `estimated_time_spent` per day must not exceed 9 hours.
    - Output **pure JSON only**, no explanations or comments.

    User request: {user_query}
    Optimized spots JSON: {json.dumps(itinerary_data, separators=(',', ':'))}
    Now think carefully and output only the final JSON — no explanations.
    """

    config = types.GenerateContentConfig(
        temperature=0.6,
        top_p=0.8,
        max_output_tokens=24000,
        response_mime_type="application/json",
    )

    response = _client.models.generate_content(
        model=MODEL_ID,
        contents=prompt,
        config=config,
    )

    refined_output = response.text.strip()
    print(f"⏱ format_itinerary_with_llm done in {time.time() - start_time:.2f} sec")

    # Clean & parse JSON safely
    def clean_json_output(text):
        if text.startswith("```json") and text.endswith("```"):
            text = text[7:-3].strip()
        elif text.startswith("```") and text.endswith("```"):
            text = text[3:-3].strip()
        return text.strip()

    try:
        cleaned_output = clean_json_output(refined_output)
        data = json.loads(cleaned_output)

        if isinstance(data, dict):
            return [data]
        elif isinstance(data, list):
            return data
        else:
            return [{"error": "Unexpected format", "raw": data}]


    except json.JSONDecodeError:

        print("⚠️ JSON parsing failed on first attempt")

        cleaned_output = clean_json_output(refined_output)


        if cleaned_output.count("{") == cleaned_output.count("}"):

            try:

                print("🔍 Braces balanced — retrying JSON parse without auto-fix...")

                return [json.loads(cleaned_output)]

            except:

                print("❌ Retry parse failed, will use auto-fix")

        # ----------------------------------------------------

        # FALLBACK → Auto-fix ONLY if needed

        # ----------------------------------------------------

        print("🛠 Running JSON auto-fix...")

        fixed = fix_broken_json(cleaned_output)

        if isinstance(fixed, dict) and "error" not in fixed:

            return [fixed]

        elif isinstance(fixed, list):

            return fixed

        else:

            return [{"error": "Invalid JSON even after fix", "raw_text": cleaned_output}]


# ===========================
# STEP 4/5 – Weather + local path optimization on LLM output
# ===========================
async def fetch_with_retry(session, url, params, retries=2):
    for attempt in range(retries + 1):
        try:
            async with session.get(
                url, params=params, timeout=ClientTimeout(total=10)
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
        except Exception:
            pass
        await asyncio.sleep(1 * (2 ** attempt))
    return {}


async def fetch_weather(session, lat, lon):
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"}

    data = await fetch_with_retry(session, url, params)
    if not data or "weather" not in data:
        return "unknown"

    cond = data["weather"][0]["main"].lower()
    if "rain" in cond:
        return "rainy"
    elif "cloud" in cond:
        return "cloudy"
    elif "clear" in cond:
        return "clear"
    else:
        return cond


def _get_lat_lon_from_activity(act: Dict) -> Tuple[Optional[float], Optional[float]]:
    lat = act.get("lat")
    lon = act.get("long", act.get("lng"))
    try:
        lat = float(lat)
        lon = float(lon)
    except Exception:
        return None, None
    return lat, lon


def tsp_order_day(hotel: Dict, activities: List[Dict]) -> List[Dict]:

    if not activities:
        return []

    current_lat = hotel.get("lat") or 0.0
    current_lng = hotel.get("lng") or hotel.get("long") or 0.0

    unvisited = activities[:]
    ordered: List[Dict] = []

    while unvisited:
        def dist(a):
            lat, lon = _get_lat_lon_from_activity(a)
            if lat is None or lon is None:
                return float("inf")
            return haversine_km(current_lat, current_lng, lat, lon)

        next_act = min(unvisited, key=dist)
        ordered.append(next_act)

        lat, lon = _get_lat_lon_from_activity(next_act)
        if lat is not None and lon is not None:
            current_lat, current_lng = lat, lon

        unvisited.remove(next_act)

    return ordered


async def process_single_trip(step3: Dict) -> Dict:
    from datetime import date, timedelta

    hotel = step3.get("hotel", {"lat": 0, "lng": 0, "name": "Unknown"})
    itinerary_name = step3.get("itinerary_name")
    days: Dict[str, List[Dict]] = step3.get("itinerary", {})


    optimized_days: Dict[str, List[Dict]] = {}
    for day_name, activities in days.items():
        optimized_days[day_name] = tsp_order_day(hotel, activities)

    start_date = date.fromisoformat(step3.get("date", date.today().isoformat()))


    async with aiohttp.ClientSession() as session:
        async with asyncio.TaskGroup() as tg:
            weather_tasks = []
            for _, activities in optimized_days.items():
                for act in activities:
                    lat, lon = _get_lat_lon_from_activity(act)
                    if lat is None or lon is None:
                        # push dummy task with constant result
                        async def dummy():
                            return "unknown"
                        weather_tasks.append(tg.create_task(dummy()))
                    else:
                        weather_tasks.append(
                            tg.create_task(fetch_weather(session, lat, lon))
                        )

        weathers = [t.result() for t in weather_tasks]


    wi = 0
    for _, acts in optimized_days.items():
        for a in acts:
            if wi < len(weathers):
                a["weather"] = weathers[wi]
            wi += 1


    routes = []
    for _, activities in optimized_days.items():
        routes.append({"optimized_order": activities, "polyline": None})

    return {
        "trip_details": {
            "trip_name": f"Trip to {hotel.get('name', 'Destination')}",
            "itinerary_name": itinerary_name,
            "start_date": start_date.isoformat(),
            "end_date": (start_date + timedelta(days=len(optimized_days) - 1)).isoformat(),
            "duration_days": len(optimized_days),
            "destination": hotel.get("name", "Unknown"),
        },
        "hotel": hotel,
        "optimized_routes": {f"Day {i+1}": routes[i] for i in range(len(routes))},
        "itinerary": optimized_days,
    }


# -------------------------
# PUBLIC ENTRY – full pipeline post-LLM
# -------------------------
async def run_itinerary_pipeline(step3_data):

    t0 = time.time()

    async def runner():
        if isinstance(step3_data, list):
            results = []
            for trip in step3_data:
                results.append(await process_single_trip(trip))
            return results
        else:
            return await process_single_trip(step3_data)

    final_output = await runner()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)

    print(f" Done! Route + Weather enriched. Took {time.time() - t0:.2f}s")
    return final_output




# if __name__ == "__main__":
#     import json
#     from colorama import Fore, Style
#     import asyncio
#     from datetime import datetime
#     import json
#
#
#     prompt_1 = (
#         "tripplan to afericaa for 3 days for 7 members 25k budget"
#     )
#
#     print(f"user query is : {prompt_1}\n\n")
#
#
#
#     def log_time(step_name, start_time, end_time):
#         duration = (end_time - start_time).total_seconds()
#         print(f"{Fore.MAGENTA}  {step_name} took {duration:.2f} seconds{Style.RESET_ALL}\n")
#         return duration
#
#
#     overall_start = datetime.now()
#     print(f"{Fore.YELLOW} Process started at: {overall_start.strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}\n")
#
#     print(f"{Fore.CYAN}{'-' * 50}\n STEP 1: Understanding User Intent\n{'-' * 50}{Style.RESET_ALL}")
#     start_step1 = datetime.now()
#     trip1 = get_structured_trip_details(prompt_1)
#
#     end_step1 = datetime.now()
#     print("\nStructured Intent Response:\n")
#     print(trip1.model_dump_json(indent=2))
#     step1_time = log_time("STEP 1 (Understanding User Intent)", start_step1, end_step1)
#     # log_process("STEP 1 - Understanding User Intent", step1_time)
#
#     print(f"\n{Fore.CYAN}{'-' * 50}\nSTEP 2: Destination + Spots Search + Hotel Search\n{'-' * 50}{Style.RESET_ALL}")
#     start_step2 = datetime.now()
#     # step2 = run_step2(trip1.model_dump())
#     step2 = asyncio.run(run_step2(trip1.model_dump()))
#     end_step2 = datetime.now()
#     print(json.dumps(step2, indent=2))
#     step2_time = log_time("STEP 2 (Destination + Spots + Hotels)", start_step2, end_step2)
#     # log_process("STEP 2 - Destination + Spots Search + Hotel Search", step1_time)
#
#     print(f"\n{Fore.GREEN}{'-' * 50}\nSTEP 3: Distance + Cost Estimation\n{'-' * 50}{Style.RESET_ALL}")
#     start_step3 = datetime.now()
#     step3 = asyncio.run(process_spots(step2))
#     end_step3 = datetime.now()
#     print(json.dumps(step3, indent=2))
#     step3_time = log_time("STEP 3 (Distance + Cost Estimation)", start_step3, end_step3)
#
#     print(f"\n{Fore.YELLOW}{'-' * 50}\n Bridge: Step 3 → Step 4 Conversion\n{'-' * 50}{Style.RESET_ALL}")
#     start_step4 = datetime.now()
#     python_output = optimize_day_plan(step2, step3)
#     final_itinerary = format_itinerary_with_llm(python_output, prompt_1)
#     end_step4 = datetime.now()
#     print("\nLLM Formatted Itinerary:\n")
#     print(json.dumps(final_itinerary, indent=2))
#     step4_time = log_time("STEP 3 to 4 (Itinerary Optimization + LLM Formatting)", start_step4, end_step4)
#
#     print(
#         f"\n{Fore.MAGENTA}{'=' * 50}\nSTEP 4 & 5 & STEP 6: Weather | Final Itinerary | Enhancements \n{'=' * 50}{Style.RESET_ALL}"
#     )
#     start_step5 = datetime.now()
#     result = asyncio.run(run_itinerary_pipeline(final_itinerary))
#
#     end_step5 = datetime.now()
#     print("\nFINAL RESULT:\n")
#     print(json.dumps(result, indent=2))
#     step5_time = log_time("STEP 5–6 (Weather + Final Enhancements)", start_step5, end_step5)
#
#     overall_end = datetime.now()
#     overall_duration = (overall_end - overall_start).total_seconds()
#
#     print(f"{Fore.GREEN} DONE! Your trip plan has been successfully generated{Style.RESET_ALL}")
#     print(f"{Fore.CYAN} Process finished at: {overall_end.strftime('%Y-%m-%d %H:%M:%S')}{Style.RESET_ALL}")
#     print(f"{Fore.BLUE} TOTAL EXECUTION TIME: {overall_duration:.2f} seconds{Style.RESET_ALL}")
#
#     print(f"\n{Fore.WHITE}{'=' * 50}")
#     print(f"Execution Time Summary:")
#     print(f"  Step 1: {step1_time:.2f}s")
#     print(f"  Step 2: {step2_time:.2f}s")
#     print(f"  Step 3: {step3_time:.2f}s")
#     print(f"  Step 3-4 convertor: {step4_time:.2f}s")
#     print(f"  Step 4-5–6: {step5_time:.2f}s")
#     print(f"{'-' * 50}")
#     print(f"  Total Time: {overall_duration:.2f}s")
#     print(f"{'=' * 50}{Style.RESET_ALL}")
