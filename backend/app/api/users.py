from flask import Blueprint, request, jsonify
from app.database.db_config import get_users_collection
from datetime import datetime

users_bp = Blueprint('users', __name__)

@users_bp.route('/api/users', methods=['POST'])
def create_or_update_user():
    try:
        user_data = request.json
        users_collection = get_users_collection()
        
        if not user_data:
            return jsonify({"error": "No data provided"}), 400
            
        email = user_data.get('email')
        if not email:
            return jsonify({"error": "Email is required"}), 400

        # Prepare user document
        user_doc = {
            "email": email,
            "name": user_data.get('name'),
            "picture": user_data.get('picture'),
            "google_id": user_data.get('id'), # sub from google token
            "last_login": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Determine if new user or existing
        existing_user = users_collection.find_one({"email": email})
        
        if existing_user:
            # Update specific fields
            users_collection.update_one(
                {"email": email},
                {"$set": user_doc}
            )
            created = False
        else:
            # Insert new user with created_at
            user_doc["created_at"] = datetime.utcnow()
            users_collection.insert_one(user_doc)
            created = True
            
        return jsonify({
            "success": True, 
            "message": "User saved successfully", 
            "created": created
        }), 200

    except Exception as e:
        print(f"Error saving user: {e}")
        return jsonify({"error": str(e)}), 500
