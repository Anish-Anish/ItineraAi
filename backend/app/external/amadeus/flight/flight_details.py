import requests


def get_amadeus_token(client_id, client_secret):
    try:
        print(f" Attempting to get Amadeus token with client_id: {client_id[:8]}...")
        token_headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        token_data = {'grant_type': 'client_credentials', 'client_id': client_id, 'client_secret': client_secret}
        token_url = 'https://test.api.amadeus.com/v1/security/oauth2/token'
        token_response = requests.post(token_url, headers=token_headers, data=token_data)

        print(f" Token response status: {token_response.status_code}")
        if token_response.status_code != 200:
            print(f" Token response content: {token_response.text}")

        token_response.raise_for_status()
        token_data = token_response.json()
        access_token = token_data.get('access_token')

        if access_token:
            print(f" Successfully obtained Amadeus token")
        else:
            print(f" No access token in response: {token_data}")

        return access_token
    except requests.exceptions.RequestException as e:
        print(f" Error getting access token: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response content: {e.response.text}")
        return None

def get_iata_code_for_city(access_token, city_name):
    if not access_token: return None
    iata_headers = {'Authorization': f'Bearer {access_token}'}
    iata_params = {
        'keyword': city_name,
        'subType': 'CITY,AIRPORT',
        'page[limit]': 1,
        'view': 'FULL'
    }
    location_search_url = 'https://test.api.amadeus.com/v1/reference-data/locations'
    try:
        iata_response = requests.get(location_search_url, headers=iata_headers, params=iata_params)
        iata_response.raise_for_status()
        data = iata_response.json().get('data')
        return data[0].get('iataCode') if data and len(data) > 0 else None
    except requests.exceptions.RequestException as e:
        print(f" Error during IATA code lookup for {city_name}: {e}")
        return None