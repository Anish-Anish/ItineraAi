from flask import Blueprint, request, jsonify
from app.services.hotel_service import search_hotels
import json

hotels_bp = Blueprint('hotels', __name__)

@hotels_bp.route('/api/hotels', methods=['POST', 'OPTIONS'])
def search_hotels_endpoint():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight passed'}), 200
    
    try:
        data = request.get_json(silent=True) or {}
        print("\n Incoming Hotel Search Request:")
        print(json.dumps(data, indent=2))
        
        # Extract required fields
        city = data.get('city', '').strip()
        check_in = data.get('checkIn', '').strip()
        check_out = data.get('checkOut', '').strip()
        guests = data.get('guests', '2')
        rooms = data.get('rooms', '1')
        
        if not city:
            return jsonify({
                "success": False,
                "error": "City is required for hotel search",
                "hotels": []
            }), 400
        
        hotels = search_hotels(city, check_in, check_out, guests, rooms)
        
        response_data = {
            "success": True,
            "hotels": hotels,
            "total_hotels": len(hotels),
            "search_params": {
                "city": city,
                "checkIn": check_in,
                "checkOut": check_out,
                "guests": guests,
                "rooms": rooms
            }
        }
        
        print(f" Found {len(hotels)} hotels")
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f" Error in hotel search endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Hotel search error: {str(e)}",
            "hotels": []
        }), 500
