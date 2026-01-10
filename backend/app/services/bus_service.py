import json
from datetime import datetime
from app.external.google_maps.bus import get_bus_routes_json

def search_bus_routes(origin, destination, departure_date=None):

    print(f"Searching bus routes from {origin} to {destination}")
    
    departure_time = None
    if departure_date:
        try:
            date_obj = datetime.strptime(departure_date, '%Y-%m-%d')
            departure_time = int(date_obj.timestamp())
        except ValueError:
            print(f" Invalid date format: {departure_date}")
    
    routes_result = get_bus_routes_json(origin, destination, departure_time)

    if isinstance(routes_result, str):
        try:
            routes_data = json.loads(routes_result)
        except json.JSONDecodeError:
            raise Exception("Failed to parse bus routes data")
    else:
        routes_data = routes_result
    
    transformed_routes = []
    route_id = 1
    
    for route_key, route_info in routes_data.items():
        buses = []
        bus_count = 1
        while f"BUS {bus_count}" in route_info:
            bus_data = route_info[f"BUS {bus_count}"]
            buses.append({
                "operator": bus_data.get("name", f"Bus {bus_count}"),
                "from": bus_data.get("route", "").split(" → ")[0] if " → " in bus_data.get("route", "") else route_info.get("start", ""),
                "to": bus_data.get("route", "").split(" → ")[1] if " → " in bus_data.get("route", "") else route_info.get("destination", ""),
                "trip_time": bus_data.get("bus_trip_time", "")
            })
            bus_count += 1
        
        if not buses:
            buses.append({
                "operator": "Bus Service",
                "from": route_info.get("start", origin),
                "to": route_info.get("destination", destination),
                "trip_time": route_info.get("time_for_trip", "")
            })
        
        transformed_route = {
            "id": route_id,
            "routeName": f"{route_info.get('start', origin)} to {route_info.get('destination', destination)}",
            "duration": route_info.get("time_for_trip", "N/A"),
            "type": route_info.get("type", "Bus Route"),
            "buses": buses,
            "price": 450 + (route_id * 50),
            "departureTime": "08:00 AM",
            "arrivalTime": "02:00 PM"
        }
        
        transformed_routes.append(transformed_route)
        route_id += 1
    
    print(f"Found {len(transformed_routes)} bus routes")
    return transformed_routes
