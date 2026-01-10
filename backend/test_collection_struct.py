from datetime import datetime
from bson import ObjectId
from app.database.db_config import get_conversations_collection, get_messages_collection
import uuid
from datetime import datetime


def create_conversation(conversation_id=None):
    list_conversations_collection = get_conversations_collection()

    if list_conversations_collection is None:
        raise Exception("Database not connected")

    conversation_id = conversation_id or str(uuid.uuid4())

    conversation = {
        "conversation_id": conversation_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "message_count": 0
    }

    result = list_conversations_collection.insert_one(conversation)
    conversation["_id"] = str(result.inserted_id)

    return conversation


def store_chat_message(conversation_id, run_id, role, content, metadata=None):
    chat_message_collection = get_messages_collection()

    if chat_message_collection is None:
        raise Exception(" chat_message_collection Database not connected")

    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow()
    }

    chat_message_collection.update_one(
        {"conversation_id": conversation_id},
        {
            "$push": {"run_id": run_id,"messages": message},
            "$inc": {"message_count": 1},
            "$set": {"updated_at": datetime.utcnow()},
            "$setOnInsert": {
                "created_at": datetime.utcnow(),
                "conversation_id": conversation_id
            }
        },
        upsert=True
    )
    return message


# ans = store_chat_message("test","run1","user","content")
# print(ans)


