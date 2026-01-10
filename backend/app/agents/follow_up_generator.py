import sys

from app.agents.llm_init import get_llm
import json
import re
from datetime import datetime

def generate_contextual_follow_ups(user_query: str, conversation_list) -> list:

    favourite_spots = ["delhi", "mumbai", "dubai","spain","australia", "goa"]
    conversation_list = list(str(conv) for conv in conversation_list)
    # print(conversation_list)
    # print(type(conversation_list))
    # sys.exit()
    prompt = f"""
        You generate short next-user intents for a travel assistant.
        
        Task:
            Generate 3–5 follow-up USER INTENT statements based on the latest query and context.
        
        Rules:
            - NOT questions
            - Start with: plan, suggest, find
            - Each item ≤ 6 words
            - Actionable travel requests only
            - Include emojis
            - Include 1–2 items about flight or hotel
            - Use conversation context when relevant
            - use yes or no if needed
            - keep focus on answer for the last ai message based on the conversational context. 
                for example: if ai ask `Where are we heading? 🗺️ And for how long? ⏳` the questions should be `  
                             ` to spain, 2 days`,
                             ` to goa, one week` like that.
            - do not ask any suggestion to the system.
            
        Input:
            User query: {user_query}
            Context: {conversation_list}
            Favorite spots: {favourite_spots}
            current date and time : {datetime.now()}
        
        Output:
            Return ONLY a valid JSON array of strings.
            No markdown. No explanation.
    """

    try:
        raw = get_llm().invoke(prompt)
        content = raw.content.strip()

        # 🔥 REMOVE ```json ``` OR ``` ```
        content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content, flags=re.IGNORECASE)

        # 🔥 FINAL SAFETY GUARD
        if not content.startswith("["):
            raise ValueError("LLM did not return JSON array")

        follow_ups = json.loads(content)

        if not isinstance(follow_ups, list):
            raise ValueError("Follow-ups must be a list")

        print(f"the follow up questions are :{follow_ups}")
        return follow_ups

    except Exception as e:
        print("Error parsing follow-ups:", e)
        print("RAW CONTENT:", repr(raw.content) if 'raw' in locals() else None)

        return [
            "Plan a trip 🗺️",
            "Find flight options ✈️",
            "Book hotel stay 🏨",
            "Explore destinations 🌍",
            "Suggest travel ideas 💡"
        ]
