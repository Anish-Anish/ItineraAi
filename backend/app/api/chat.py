from flask import Blueprint, request, jsonify
from app.services.chat_service import process_chat_message

chat_bp = Blueprint('chat', __name__)

@chat_bp.route("/api/chat", methods=["POST", "OPTIONS"])
def chat_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight passed'}), 200
    
    try:
        data = request.get_json()
        user_query = data.get("query", "").strip()
        conversation_id = data.get("conversation_id")
        run_id = data.get("run_id")

        if not user_query:
            return jsonify({
                "response_type": "chat",
                "message": "Please provide a query."
            }), 400
        
        response_data = process_chat_message(user_query, conversation_id, run_id)

        print(" - "*50)
        print(f"\n\nFinal Response Sent to ui : \n\n {response_data}")
        print(" - "*50)

        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Global Error: {e}")
        return jsonify({
            "response_type": "error",
            "message": "Unexpected server error occurred. Please try again.",
            "follow_up_questions": [
                "Plan a trip",
                "Find flight options",
                "Get hotel recommendations",
                "Explore destinations"
            ]
        }), 500