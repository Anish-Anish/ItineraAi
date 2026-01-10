import sys

from flask import Blueprint, request, jsonify
from app.agents.follow_up_generator import generate_contextual_follow_ups
from app.database.chat_storage import get_conversation_messages
follow_up_gen = Blueprint('follow_up', __name__)


@follow_up_gen.route("/api/follow_up", methods=["POST", "OPTIONS"])
def follow_up_gen_endpoint():

    if request.method == "OPTIONS":
        return ("", 204)

    print("\n\n\n")
    print(" * " * 50)
    print("inside follow up generator endpoint")
    print(" * " * 50)
    print("\n\n\n")

    data = request.get_json(silent=True) or {}

    ai_message = data.get("message") or ""
    conversation_id = data.get("conversation_id")

    conversation_list = get_conversation_messages(conversation_id)

    try:

        follow_ups = generate_contextual_follow_ups(ai_message, conversation_list)
    except Exception as e:
        print(e)
        follow_ups = [
            "Plan a trip",
            "Find flight options",
            "Get hotel recommendations",
            "Explore destinations",
        ]

    return jsonify({"follow_up_questions": follow_ups})


