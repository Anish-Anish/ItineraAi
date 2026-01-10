from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.database.chat_storage import get_conversation_messages
from langgraph.types import Command
from typing import TypedDict, Annotated, List, Literal, Any, Dict
from datetime import datetime, timedelta
import json
from app.agents.llm_init import get_llm

# 9.  If you have more question to be asked then do not ask more then two questions to the user.

def _initial_agent(state) :

    conversation_messages_list = get_conversation_messages(state["conversation_id"])

    user_query = state["messages"][-1].content

    system_prompt = f"""
        You are a travel intent analyzer.

        Your job is to extract intent and entities from the CURRENT user query.
        You may use chat history ONLY if the current query is a continuation of a previous intent.

        RULES:
        1. Never infer from very old multiple past intents (like more than 6).
        2. If chat history contains multiple destinations, use ONLY the most recent relevant human message.
        3. If the current query is generic (e.g., "book flight"),treat it as a continuation of the most recent HUMAN message that contains information or intent.
           Ignore assistant messages.
        4. If no single clear previous intent exists, do NOT infer and ask a follow-up next question to get information.
        5. find the current question belongs to which scenario it should be ( trip, hotel, flight, bus ).
        6. IMPORTANT FLOW RULE:
           - If the user expresses intent to plan a trip, you MUST FIRST help create the trip itinerary.
           - DO NOT move to flight, hotel, or bus booking UNTIL the itinerary plan is created successfully.
           - Only AFTER a trip itinerary is created may you suggest booking flights, hotels, or transport.
        7. IMPORTANT PROGRESSION RULE:
           If all mandatory fields for the current scenario are already available,
           do NOT ask clarification questions.
        8. follow_question should be slight funny, smart to convey our requirements, use emojis, use proper markdowns.
        10. Do not ask long questions and do not ask questions which have more than 10 words which convey your requriement.
        11. if user explicitly asks to book (trip plan/ hotel/ flight/ bus) do not force him to look into other sections.
        12. Follow the conversational flow and collect necessary information.
        13. If the user explicitly asks to create or plan a trip (e.g., “create a Kerala trip plan”), start planning immediately and DO NOT ask confirmation questions like “Are you ready to start?” or “Shall we proceed?”.
        14. If you think you have not collected all the required inputs then set the `clarify_question` to True.
        15. then add the question that you need to ask to the user in the `clarify_question` field.
        16. then you need to rewrite the current user query to compete query which has all the details in it, and add it in `rewritten_query`.
        
        Current user query:
        human -> {user_query}

        Chat history:
        {conversation_messages_list}

        Current date:
        {datetime.now()} -> if the user mentioned date do not take past date so ask clarification question.

        If information is missing, set the field to null.

        MANDATORY FIELDS BY SCENARIO:
            Trip planning requires:
             - destination
             - duration_days
             - dates

            Flight booking requires:
            - origin_city
            - destination_city
            - departure_date
            - adults

            Hotel booking requires:
            - destination_city
            - number_of_days
            - adults
            - check_in_date

        Output ONLY valid JSON in this structure:
        {{
          "origin_city": null,
          "destination_city": null,
          "departure_date": null,
          "adults": null,
          "number_of_days": null,
          "scenario": "",
          "clarify_question_status": "If you have any question to be asked to the user then set to `True` else set to `False`.",
          "clarify_question": "",
          "reason_for_your_response": "precise reason",
          "initial_agent_done": True,
          "rewritten_query": ""
        }}
"""

    raw_content = get_llm().invoke(system_prompt).content

    clean_content = raw_content.strip()

    clean_content = clean_content.replace("```json", "")
    clean_content = clean_content.replace("```", "")
    clean_content = clean_content.strip()

    resp = json.loads(clean_content)

    origin_city = resp["origin_city"]
    destination_city = resp["destination_city"]
    departure_date = resp["departure_date"]
    adults = resp["adults"]
    number_of_days = resp["number_of_days"]
    scenario = resp["scenario"]
    clarify_question_status = resp["clarify_question_status"]
    clarify_question = resp["clarify_question"]
    initial_agent_done = resp["initial_agent_done"]
    rewritten_query = resp["rewritten_query"]


    return (
        origin_city,
        destination_city,
        departure_date,
        adults,
        number_of_days,
        scenario,
        clarify_question_status,
        clarify_question,
        initial_agent_done,
        rewritten_query
    )

