from flask import Blueprint, request, jsonify
from app.services.bus_service import search_bus_routes
import json

buses_bp = Blueprint('buses', __name__)

@buses_bp.route('/api/bus-routes', methods=['POST', 'OPTIONS'])
def get_bus_routes_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight passed'}), 200
    
    try:
        data = request.get_json(silent=True) or {}
        print("\n Incoming Bus Routes Request:")
        print(json.dumps(data, indent=2))
        
        origin = data.get('origin', '').strip()
        destination = data.get('destination', '').strip()
        departure_date = data.get('departure_date')
        
        if not origin or not destination:
            return jsonify({
                "error": "Both origin and destination are required",
                "success": False
            }), 400
        
        routes = search_bus_routes(origin, destination, departure_date)
        
        response_data = {
            "success": True,
            "routes": routes,
            "total_routes": len(routes),
            "search_params": {
                "origin": origin,
                "destination": destination,
                "departure_date": departure_date
            }
        }
        
        print(f" Found {len(routes)} bus routes")
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f" Error in bus routes endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}",
            "routes": []
        }), 500
