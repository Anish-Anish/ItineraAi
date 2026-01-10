import json
import sys

import requests
from app.external.amadeus.flight.flight_details import get_amadeus_token, get_iata_code_for_city

def search_flights(origin, destination, departure_date, passengers='1', travel_class='economy'):

    print(f" Searching flights from {origin} to {destination} on {departure_date}")
    
    client_id = 'REMOVED_API_KEY'
    client_secret = 'REMOVED_SECRET'
    usd_to_inr_rate = 88.23
    
    try:
        token = get_amadeus_token(client_id, client_secret)
        if not token:
            raise Exception("Failed to get Amadeus access token.")
        
        origin_iata = get_iata_code_for_city(token, origin)
        destination_iata = get_iata_code_for_city(token, destination)
        if not (origin_iata and destination_iata):
            raise Exception("Failed to find IATA codes for the cities.")
        
        flight_params = {
            'originLocationCode': origin_iata,
            'destinationLocationCode': destination_iata,
            'departureDate': departure_date,
            'adults': int(passengers),
            'currencyCode': 'USD',
            'max': 10
        }
        
        flight_headers = {'Authorization': f'Bearer {token}'}
        flight_search_url = 'https://test.api.amadeus.com/v2/shopping/flight-offers'
        flight_response = requests.get(flight_search_url, headers=flight_headers, params=flight_params)
        flight_response.raise_for_status()
        flight_data = flight_response.json().get('data', [])


        print(f"the flight response is: {flight_response}\n")
        print(f"the flight data is: {flight_data}\n")

        sys.exit()

        if not flight_data:
            return _get_mock_flights(origin, destination)
        
        structured_flights = []
        for i, offer in enumerate(flight_data[:10]):
            try:
                price_usd = float(offer['price']['grandTotal'])
                price_inr = price_usd * usd_to_inr_rate
                
                itinerary = offer['itineraries'][0]
                segments = itinerary['segments']
                first_segment = segments[0]
                last_segment = segments[-1]
                
                carrier_code = first_segment['carrierCode']
                airline_names = {
                    'AI': 'Air India', '6E': 'IndiGo', 'SG': 'SpiceJet',
                    'UK': 'Vistara', 'I5': 'AirAsia India', 'G8': 'GoAir'
                }
                airline_name = airline_names.get(carrier_code, f'{carrier_code} Airlines')
                
                structured_flight = {
                    "id": i + 1,
                    "airline": airline_name,
                    "logo": "✈️",
                    "departureTime": first_segment['departure']['at'].split('T')[1][:5],
                    "arrivalTime": last_segment['arrival']['at'].split('T')[1][:5],
                    "duration": itinerary['duration'].replace('PT', '').replace('H', 'h ').replace('M', 'm'),
                    "price": str(int(price_inr)),
                    "from": origin,
                    "to": destination,
                    "flight_number": f"{carrier_code}{first_segment['number']}",
                    "is_direct": len(segments) == 1
                }
                
                structured_flights.append(structured_flight)
            except Exception as e:
                print(f"Error processing flight offer {i}: {e}")
                continue
        
        print(f" Found {len(structured_flights)} flights")
        return structured_flights
        
    except Exception as api_error:
        print(f"Amadeus API Error: {str(api_error)}")
        return _get_mock_flights(origin, destination)

def _get_mock_flights(origin, destination):
    """Return mock flight data as fallback"""
    return [
        {
            "id": 1,
            "airline": "Air India",
            "logo": "✈️",
            "departureTime": "09:30",
            "arrivalTime": "12:45",
            "duration": "3h 15m",
            "price": "4299",
            "from": origin,
            "to": destination
        },
        {
            "id": 2,
            "airline": "IndiGo",
            "logo": "✈️",
            "departureTime": "14:20",
            "arrivalTime": "17:35",
            "duration": "3h 15m",
            "price": "3899",
            "from": origin,
            "to": destination
        }
    ]



def test_search_flights():
    origin = "Bangalore"
    destination = "Delhi"
    departure_date = "2026-01-10"

    results = search_flights(
        origin=origin,
        destination=destination,
        departure_date=departure_date,
        passengers="1"
    )

    print("\n=== FLIGHT SEARCH RESULT ===")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    test_search_flights()