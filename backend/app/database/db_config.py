from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = "itinera"

db = None
try:
    client = MongoClient(MONGO_URI)
    client.admin.command("ping")
    db = client[DATABASE_NAME]
    print(f" MongoDB connected successfully to database: {DATABASE_NAME}")
except ConnectionFailure as e:
    print(f" Failed to connect to MongoDB: {e}")

list_conversations_collection = db["conversations"] if db is not None else None
chat_messages_collection = db["chat_messages"] if db is not None else None

def get_db():
    return db


def get_conversations_collection():
    return list_conversations_collection


def get_messages_collection():
    return chat_messages_collection

users_collection = db["users"] if db is not None else None

def get_users_collection():
    return users_collection
