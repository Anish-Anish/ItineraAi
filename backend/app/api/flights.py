from flask import Blueprint, request, jsonify
from app.services.flight_service import search_flights
import json

flights_bp = Blueprint('flights', __name__)

@flights_bp.route('/api/flights', methods=['POST', 'OPTIONS'])
def search_flights_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight passed'}), 200
    
    try:
        data = request.get_json(silent=True) or {}
        print("\n Incoming Flight Search Request:")
        print(json.dumps(data, indent=2))
        
        # Extract required fields
        origin = data.get('from', '').strip()
        destination = data.get('to', '').strip()
        departure_date = data.get('departure', '').strip()
        passengers = data.get('passengers', '1')
        travel_class = data.get('class', 'economy')
        
        if not all([origin, destination, departure_date]):
            return jsonify({
                "success": False,
                "error": "Origin, destination, and departure date are required",
                "flights": []
            }), 400
        
        flights = search_flights(origin, destination, departure_date, passengers, travel_class)
        
        response_data = {
            "success": True,
            "flights": flights,
            "total_flights": len(flights),
            "search_params": {
                "from": origin,
                "to": destination,
                "departure": departure_date,
                "passengers": passengers,
                "class": travel_class
            }
        }
        
        print(f" Found {len(flights)} flights")
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f" Error in flight search endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}",
            "flights": []
        }), 500
