from flask import Blueprint, request, jsonify
from app.database.chat_storage import (
    create_conversation,
    get_conversation_messages,
    get_conversation_info,
    get_all_conversations_title,
    delete_conversation
)

conversations_bp = Blueprint('conversations', __name__)

@conversations_bp.route("/api/conversations", methods=["POST", "OPTIONS"])
def create_new_conversation():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight passed'}), 200
    
    try:
        data = request.get_json(silent=True) or {}
        conversation_id = data.get("conversation_id")
        
        conversation = create_conversation(conversation_id)
        
        return jsonify({
            "success": True,
            "conversation": conversation
        }), 201
        
    except Exception as e:
        print(f" Error creating conversation: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500



@conversations_bp.route("/api/conversations", methods=["GET"])
def get_conversations():
    try:
        limit = int(request.args.get('limit', 20))
        skip = int(request.args.get('skip', 0))
        
        conversations = get_all_conversations_title(limit=limit, skip=skip)


        ans = jsonify({
            "success": True,
            "conversations": conversations,
            "count": len(conversations)
        }), 200


        return ans
        
    except Exception as e:
        print(f"Error fetching conversations: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@conversations_bp.route("/api/conversations/<conversation_id>", methods=["GET"])
def get_conversation(conversation_id):
    """Get conversation metadata"""
    try:
        conversation = get_conversation_info(conversation_id)
        
        if not conversation:
            return jsonify({
                "success": False,
                "error": "Conversation not found"
            }), 404
        
        return jsonify({
            "success": True,
            "conversation": conversation
        }), 200
        
    except Exception as e:
        print(f"Error retrieving conversation: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@conversations_bp.route("/api/conversations/<conversation_id>", methods=["DELETE", "OPTIONS"])
def remove_conversation(conversation_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight passed'}), 200
    
    try:
        result = delete_conversation(conversation_id)
        
        return jsonify({
            "success": True,
            "result": result
        }), 200
        
    except Exception as e:
        print(f"Error deleting conversation: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@conversations_bp.route("/api/conversations/<conversation_id>/messages", methods=["GET", "OPTIONS"])
def get_conversation_messages_endpoint(conversation_id):
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight passed'}), 200
    
    try:
        limit = int(request.args.get('limit', 100))
        skip = int(request.args.get('skip', 0))
        
        messages = get_conversation_messages(
            conversation_id=conversation_id,
            limit=limit,
            skip=skip
        )
        
        conversation_info = get_conversation_info(conversation_id)
        
        return jsonify({
            "success": True,
            "conversation": conversation_info,
            "messages": messages,
            "count": len(messages)
        }), 200
        
    except Exception as e:
        print(f" Error fetching messages for conversation {conversation_id}: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
