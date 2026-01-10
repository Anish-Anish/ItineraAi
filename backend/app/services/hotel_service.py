from app.external.google_maps.accomdation import find_best_nearby_hotels

def search_hotels(city, check_in=None, check_out=None, guests='2', rooms='1'):

    print(f" Searching hotels in {city}")
    
    try:
        hotels_data = find_best_nearby_hotels(city, radius=5000, limit=10)
        
        if not hotels_data:
            return _get_mock_hotels(city)
        
        structured_hotels = []
        for i, hotel in enumerate(hotels_data):
            base_price = 2000
            rating_multiplier = hotel.get('Rating', 3.0) / 3.0
            price = int(base_price * rating_multiplier) + (i * 200)
            
            structured_hotel = {
                "id": i + 1,
                "name": hotel.get('Name', f'Hotel {i+1}'),
                "rating": hotel.get('Rating', 4.0),
                "address": hotel.get('Address', f'{city}, India'),
                "price": price,
                "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
                "amenities": ["Free WiFi", "Restaurant", "Room Service", "AC"],
                "website": hotel.get('Website', 'N/A'),
                "mapLink": hotel.get('Google Maps Link', 'N/A'),
                "description": f"Quality accommodation in {city}",
                "reviews": 500 + (i * 100)
            }
            
            structured_hotels.append(structured_hotel)
        
        print(f" Found {len(structured_hotels)} hotels")
        return structured_hotels
        
    except Exception as api_error:
        print(f" Hotel API Error: {str(api_error)}")
        return _get_mock_hotels(city)

def _get_mock_hotels(city):
    """Return mock hotel data as fallback"""
    return [
        {
            "id": 1,
            "name": f"Grand Hotel {city}",
            "rating": 4.5,
            "address": f"Central {city}, Near Railway Station",
            "price": 3500,
            "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
            "amenities": ["Free WiFi", "Swimming Pool", "Restaurant", "Gym"],
            "website": "https://example.com",
            "mapLink": "https://maps.google.com",
            "description": "Luxury hotel in the heart of the city",
            "reviews": 1250
        },
        {
            "id": 2,
            "name": f"Comfort Inn {city}",
            "rating": 4.2,
            "address": f"Business District, {city}",
            "price": 2800,
            "image": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400",
            "amenities": ["Free WiFi", "Breakfast", "Parking", "AC"],
            "website": "https://example.com",
            "mapLink": "https://maps.google.com",
            "description": "Comfortable stay with modern amenities",
            "reviews": 890
        }
    ]
