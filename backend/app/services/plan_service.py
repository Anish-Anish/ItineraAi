import json
import asyncio
from app.agents.re_planner import (
    get_structured_trip_details, 
    run_step2, 
    process_spots,
    optimize_day_plan, 
    format_itinerary_with_llm, 
    run_itinerary_pipeline
)
from app.agents.llm_init import get_llm
from app.agents.follow_up_generator import generate_contextual_follow_ups
from app.services.translation_service import translate_auto_to_english



def enhance_plan(plan_details, user_query, user_enhance_query, card_index):

    print(f"\n Enhancing plan with query: {user_enhance_query}")
    
    new_enhance_query = f"{user_enhance_query} {user_query}"
    
    # Step 1: Get structured trip intent
    trip1 = get_structured_trip_details(new_enhance_query)
    if trip1 is None:
        raise Exception("Failed to extract structured trip details from the query")
    
    print(" Step 1: Structured Trip Intent Extracted")
    
    step2 = asyncio.run(run_step2(trip1.model_dump()))
    print(" Step 2: Spots & Hotels Retrieved")
    
    step3 = asyncio.run(process_spots(step2))
    print(" Step 3: Spots Processed")
    
    python_output = optimize_day_plan(step2, step3)
    final_itinerary = format_itinerary_with_llm(
        python_output, new_enhance_query, plan_details
    )
    
    if isinstance(final_itinerary, dict):
        final_itinerary["card_index"] = card_index
    elif isinstance(final_itinerary, list):
        for item in final_itinerary:
            if isinstance(item, dict):
                item["card_index"] = card_index
    
    print(" Step 4: Itinerary Optimized")
    
    value = asyncio.run(run_itinerary_pipeline(final_itinerary))
    
    if isinstance(value, dict):
        value["card_index"] = card_index
    elif isinstance(value, list):
        for item in value:
            if isinstance(item, dict):
                item["card_index"] = card_index
    
    print(" Enhancement Complete")
    return value

def summarize_plan(plan_data):

    print("📝 Summarizing plan...")
    
    llm_prompt = f"""
    You are a professional travel itinerary formatter.
    Convert the following raw itinerary text into proper JSON structure.

    Rules:
    - Output must be ONLY valid JSON. No extra text, no ```json, no backticks, no explanations.
    - Keep all activities and day structure intact.
    - Replace coordinates with: "view_on_map":  [ coordinates ]
    - Expand the description slightly like a friendly travel guide.
    - Do NOT shorten or remove any activity.
    - Do NOT include weather emoji, only text for weather (e.g., "clear")
    - Do NOT include numbers as separate items (clean them automatically)

    Raw itinerary text:
    {plan_data}

    Expected JSON format (structure example):
    {{
        "title": "Sample",
        "duration": "3 Days",
        "budget": "Custom",
        "days": [
            {{
                "day": "Day 1",
                "activities": [
                    {{
                        "name": "Activity Name",
                        "description": "Tour guide style explanation",
                        "time_spent": "1 hour",
                        "weather": "clear",
                        "view_on_map": [ coordinates ]
                    }}
                ]
            }}
        ]
    }}

    Now produce the final JSON output only, nothing else.
    """
    
    llm_response = get_llm().invoke(llm_prompt)
    final_summary = llm_response.content.strip()
    
    print(" Plan summarized")
    return final_summary


def finalize_plan(card_index, plan_data, user_info, user_query):

    print(" Finalizing plan...")
    
    # Translate user query
    code, text = translate_auto_to_english(user_query)

    
    response_data = {
        "success": True,
        "message": "Plan finalized successfully",
        "finalized_plan": {
            "card_index": card_index,
            "title": plan_data.get('title'),
            "duration": plan_data.get('totalDays'),
            "budget": plan_data.get('budget'),
            "destination": plan_data.get('trip_details', {}).get('destination'),
        }
    }
    
    print(" Plan finalized")
    return response_data
