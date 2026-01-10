from flask import Blueprint, request, jsonify
from app.services.plan_service import enhance_plan, summarize_plan, finalize_plan
import json

plans_bp = Blueprint('plans', __name__)

@plans_bp.route('/api/enhance', methods=['POST', 'OPTIONS'])
def enhance_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight passed'}), 200
    
    try:
        data = request.get_json(silent=True) or {}
        print("\n Incoming Enhance Request:")
        print(json.dumps(data, indent=2))
        
        # Extract fields
        plan_details = data.get("plan_details")
        user_query = data.get("query_en")
        user_enhance_query = data.get("user_enhance")
        card_index = data.get("card_index")
        
        if not all([plan_details, user_query, user_enhance_query]):
            return jsonify({
                "error": "Missing required fields (plan_details, query_en, user_enhance)"
            }), 400
        
        result = enhance_plan(plan_details, user_query, user_enhance_query, card_index)
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"\nERROR in Enhance Pipeline: {str(e)}")
        return jsonify({
            "error": f"Enhance API Error: {str(e)}"
        }), 500

@plans_bp.route("/api/summarize-plan", methods=["POST", "OPTIONS"])
def summarize_plan_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight passed'}), 200
    
    try:
        data = request.get_json(silent=True) or {}
        
        final_summary = summarize_plan(data)
        
        return jsonify({
            "success": True,
            "response": final_summary
        }), 200
        
    except Exception as e:
        print(f" Error in summarize endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@plans_bp.route('/api/finalize-plan', methods=['POST', 'OPTIONS'])
def finalize_plan_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight passed'}), 200
    
    try:
        data = request.get_json(silent=True) or {}
        print("\n Finalize Plan Request:")
        print(json.dumps(data, indent=2))
        
        card_index = data.get('cardIndex')
        plan_data = data.get('planData', {})
        user_info = data.get('userInfo', {})
        user_query = data.get('userQuery', '')
        
        response_data = finalize_plan(card_index, plan_data, user_info, user_query)
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"\n Error in finalize_plan endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Failed to finalize plan: {str(e)}"
        }), 500
