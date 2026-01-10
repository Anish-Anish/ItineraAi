from langchain_core.messages import HumanMessage
from app.agents.trip_graph import langgraph_app
from app.database.chat_storage import store_chat_message, create_conversation, append_run_message
from app.services.translation_service import translate_auto_to_english, translate_to_language

def extract_user_facing_message(final_state):

    if final_state.get("clarify_question_status") is True:
        clarify_question = final_state.get("clarify_question")
        if clarify_question:
            return clarify_question

    for msg in reversed(final_state.get("messages", [])):
        if hasattr(msg, "content"):
            content = msg.content.strip()
            if content and not content.startswith("{"):
                return content
    return "I've processed your travel request successfully!"


def process_chat_message(user_query, conversation_id, run_id):

    if not conversation_id:
        conversation = create_conversation()
        conversation_id = conversation["conversation_id"]
        print(f" Created conversation: {conversation_id}")
    else:
        print(f" Using existing conversation: {conversation_id}")
    
    detected_lang, query_en = translate_auto_to_english(user_query)
    print(f" Detected: {detected_lang} | English: {query_en}")
    
    store_chat_message(
        conversation_id=conversation_id,
        run_id= run_id,
        role="user",
        content=user_query,
        metadata={
            "detected_language": detected_lang,
            "query_en": query_en
        }
    )
    
    final_state = langgraph_app.invoke({
        "messages": [HumanMessage(content=query_en)],
        "user_query": query_en,
        "conversation_id": conversation_id
    })
    print(" - "*50)
    print("\n\nLangGraph execution complete : \n\n")
    print(final_state)
    print(" - " * 50)

    assistant_message = extract_user_facing_message(final_state)
    response_type = "chat"


    translated_message = translate_to_language(assistant_message, detected_lang)
    

    append_run_message(
        conversation_id=conversation_id,
        run_id=run_id,
        role="assistant",
        content=translated_message,
        metadata={
            "response_type": response_type,
            "scenario": final_state.get("scenario"),
            "follow": final_state.get("follow")
        }
    )
    
    response_data = {
        "response_type": response_type,
        "message": translated_message,
        "follow_up_questions": ["Plan a trip"],
        "conversation_id": conversation_id
    }
    
    if final_state.get("itinerary_plans"):
        response_data["plans"] = final_state["itinerary_plans"]
        response_data["response_type"] = "plans"
    elif final_state.get("flight_data"):
        response_data["flight_options"] = final_state["flight_data"]
        response_data["response_type"] = "flights"
    elif final_state.get("acomdation"):
        response_data["acomdation"] = final_state["acomdation"]
        response_data["response_type"] = "acomdation"
    elif final_state.get("travel_bookings"):
        response_data["travel_bookings"] = final_state["travel_bookings"]
        response_data["response_type"] = "bookings"
    
    return response_data
