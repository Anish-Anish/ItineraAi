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
        "message_count": 0,
        "conversation_title": f"New Chat - {datetime.utcnow().strftime('%b %d, %I:%M %p')}"
    }
    
    result = list_conversations_collection.insert_one(conversation)
    conversation["_id"] = str(result.inserted_id)
    
    return conversation

chat_message_collection = get_messages_collection()


def store_chat_message(conversation_id, run_id, role, content, metadata=None):

    if chat_message_collection is None:
        raise Exception(" chat_message_collection Database not connected")

    run_doc = {
        "run_id": run_id,
        "run_created_at": datetime.now(),

        "messages":[
            {
                "role" : role,
                "content": content,
                "timestamp": datetime.now(),
            }
        ]

    }
    chat_message_collection.update_one(
        {"conversation_id": conversation_id},
        {
            "$push": {"runs": run_doc},
            "$set": {
            "conversation_title": f"Chat - {datetime.now().strftime('%b %d, %I:%M %p')}",
            "updated_at": datetime.now(),
             },
            "$setOnInsert": {
                "conversation_id": conversation_id,
                "created_at": datetime.now(),
            },

        },
        upsert=True
    )

    print("insert user chat message done !")



def append_run_message(conversation_id, run_id, role, content, metadata=None):
    chat_message_collection.update_one(
        {
            "conversation_id": conversation_id,
            "runs.run_id": run_id
        },
        {
            "$push": {
                "runs.$.messages": {
                    "role": role,
                    "content": content,
                    "timestamp": datetime.now(),
                }
            },
            "$set":{
                "updated_at": datetime.now()
            }
        }
    )
    print("insert run chat message done !")


def get_conversation_messages(conversation_id, limit=100, skip=0):
    conversation_message_list = get_messages_collection()

    conversation = conversation_message_list.find_one(
        {"conversation_id": conversation_id},
        {"_id": 0}
    )

    if not conversation or "runs" not in conversation:
        print("no conversation messages")
        return []

    list_messages = []
    for run in conversation["runs"]:
        for message in run["messages"]:
            role = message["role"]
            content = message["content"]
            list_messages.append({"role": role, "content": content})

    return list_messages


# get_conversation_messages("1766861522952-cs7ivkqs")


def get_conversation_info(conversation_id):
    conversations_collection = get_conversations_collection()
    
    if conversations_collection is None:
        raise Exception("Database not connected")
    
    conversation = conversations_collection.find_one({"conversation_id": conversation_id})
    
    if conversation:
        conversation["_id"] = str(conversation["_id"])
        conversation["created_at"] = conversation["created_at"].isoformat()
        conversation["updated_at"] = conversation["updated_at"].isoformat()
    
    return conversation


def get_all_conversations_title(limit=50, skip=0):
    conversations_collection = get_messages_collection()
    
    if conversations_collection is None:
        raise Exception("Database not connected")

    conversations = list(
        conversations_collection.find(
            {},
            {
                "_id": 0,
                "conversation_id": 1,
                "conversation_title": 1,
                "updated_at": 1,
                "created_at": 1
            }
        )
        .sort("updated_at", -1)
        .skip(skip)
        .limit(limit)
    )

    # Convert datetime objects to ISO format for JSON serialization
    for conv in conversations:
        if "updated_at" in conv and conv["updated_at"]:
            conv["updated_at"] = conv["updated_at"].isoformat()
        if "created_at" in conv and conv["created_at"]:
            conv["created_at"] = conv["created_at"].isoformat()

    return conversations


def delete_conversation(conversation_id):
    messages_collection = get_messages_collection()
    conversations_collection = get_conversations_collection()
    
    if messages_collection is None or conversations_collection is None:
        raise Exception("Database not connected")
    
    # Delete all messages
    messages_result = messages_collection.delete_many({"conversation_id": conversation_id})
    
    # Delete conversation
    conversation_result = conversations_collection.delete_one({"conversation_id": conversation_id})
    
    return {
        "messages_deleted": messages_result.deleted_count,
        "conversation_deleted": conversation_result.deleted_count
    }
