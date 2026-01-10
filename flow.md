# Travel Planner Application Flow

## Overview
This document describes the complete flow of user requests from frontend to backend and back, including LLM processing and external service integrations.

## Request Flow Architecture

### 1. Frontend → Backend Entry Point
**Endpoint**: `POST /api/chat`
**File**: `app/api/chat.py`

```python
@chat_bp.route("/api/chat", methods=["POST", "OPTIONS"])
def chat_endpoint():
    data = request.get_json()
    user_query = data.get("query", "").strip()
    conversation_id = data.get("conversation_id")
    response_data = process_chat_message(user_query, conversation_id)
    return jsonify(response_data), 200
```

**Request Format**:
```json
{
    "query": "Plan a trip to Paris from Mumbai",
    "conversation_id": "optional-existing-id"
}
```

### 2. Service Layer Processing
**File**: `app/services/chat_service.py`

#### Step-by-Step Pipeline:

1. **Conversation Management**
   - Create new conversation or use existing `conversation_id`
   - Store in database via `app/database/chat_storage.py`

2. **Language Translation**
   - Auto-detect user's language
   - Translate query to English for LLM processing
   - Functions: `translate_auto_to_english()`, `translate_to_language()`

3. **Message Storage**
   - Store original user query with metadata
   - Includes detected language and English translation

4. **LLM Processing**
   ```python
   final_state = langgraph_app.invoke({
       "messages": [HumanMessage(content=query_en)],
       "user_query": query_en,
       "conversation_id": conversation_id
   })
   ```

5. **Response Extraction**
   - Extract user-friendly message from LangGraph state
   - Handle follow-up questions vs. complete responses

6. **Back Translation**
   - Translate response back to user's detected language

7. **Final Storage**
   - Store assistant response with metadata

### 3. LLM Processing - LangGraph Application
**File**: `app/agents/trip_graph.py`

#### LLM Configuration
**File**: `app/agents/llm_init.py`
- **Model**: Gemini 2.5 Flash (`gemini-2.5-flash`)
- **Provider**: Google Generative AI via LangChain
- **Temperature**: 0.0 (deterministic responses)

#### LangGraph State Management
```python
class TripState(TypedDict):
    messages: Annotated[List, add_messages]
    user_query: str
    conversation_id: str
    scenario: Optional[str]
    follow: Optional[bool]
    follow_question: Optional[str]
    itinerary_plans: Optional[List]
    flight_data: Optional[List]
    acomdation: Optional[List]
    travel_bookings: Optional[List]
```

#### Agent Processing Flow
1. **Initial Agent** (`app/agents/agents_list.py`)
   - Analyzes user intent
   - Determines scenario (trip planning, flight search, etc.)

2. **Trip Planning Agents** (`app/agents/planner.py`)
   - Extract structured trip details
   - Generate itineraries
   - Optimize day plans
   - Format responses

3. **External Service Integration**
   - Flight search via Amadeus API
   - Hotel search via Google Maps
   - Bus routes via Google Maps

### 4. External Service Integrations

#### Flight Services
**File**: `app/external/amadeus/flight/flight_details.py`
- `get_amadeus_token()` - OAuth2 authentication
- `get_iata_code_for_city()` - City to IATA code conversion
- **API**: Amadeus Test API

#### Accommodation Services
**File**: `app/external/google_maps/accomdation.py`
- `find_best_nearby_hotels()` - Hotel search and recommendations
- **API**: Google Maps Places API

#### Transportation Services
**File**: `app/external/google_maps/bus.py`
- `get_bus_routes_json()` - Bus route information
- **API**: Google Maps Directions API

### 5. Response Flow - Backend → Frontend

#### Response Structure
```json
{
    "response_type": "chat|plans|flights|acomdation|bookings",
    "message": "Translated response message",
    "follow_up_questions": ["Plan a trip", "Find flights", "Get hotels"],
    "conversation_id": "uuid-string",
    "plans": [...],           // Optional: Itinerary data
    "flight_options": [...],  // Optional: Flight search results
    "acomdation": [...],      // Optional: Hotel recommendations
    "travel_bookings": [...]  // Optional: Booking confirmations
}
```

#### Response Types
- **chat**: Simple conversational response
- **plans**: Structured itinerary with daily plans
- **flights**: Flight search results with pricing
- **acomdation**: Hotel recommendations and details
- **bookings**: Confirmed booking information

## Database Storage

### Chat Storage
**File**: `app/database/chat_storage.py`

#### Tables/Collections
- **Conversations**: Unique conversation IDs and metadata
- **Messages**: Individual chat messages with roles and content

#### Message Structure
```python
{
    "conversation_id": "uuid",
    "role": "user|assistant",
    "content": "message content",
    "metadata": {
        "detected_language": "en|hi|es|...",
        "query_en": "english translation",
        "response_type": "chat|plans|...",
        "scenario": "trip_planning|flight_search|...",
        "follow": true|false
    },
    "timestamp": "ISO datetime"
}
```

## Error Handling

### Global Error Handler
**File**: `app/middleware/error_handlers.py`

### Response Error Format
```json
{
    "response_type": "error",
    "message": "User-friendly error message",
    "follow_up_questions": [
        "Plan a trip",
        "Find flight options", 
        "Get hotel recommendations",
        "Explore destinations"
    ]
}
```

## Configuration

### Environment Variables
```bash
# LLM Configuration
GOOGLE_API_KEY=your-google-api-key

# Amadeus API
AMADEUS_API_KEY=your-amadeus-key
AMADEUS_API_SECRET=your-amadeus-secret

# Google Services
GOOGLE_MAPS_API_KEY=your-maps-key

# Flask Configuration
FLASK_ENV=development|production
PORT=8089
HOST=0.0.0.0
```

### Application Factory
**File**: `app/__init__.py`
- Creates Flask application instance
- Registers all API blueprints
- Initializes middleware (CORS, error handlers)

## API Endpoints

### Registered Blueprints
- `/api/chat` - Main chat interface
- `/api/conversations` - Conversation management
- `/api/flights` - Flight-specific operations
- `/api/hotels` - Hotel-specific operations
- `/api/buses` - Bus route operations
- `/api/plans` - Itinerary planning

### Health Endpoints
- `/` - Application status
- `/health` - Health check

## Complete Request Flow Summary

```
Frontend App
    ↓ POST /api/chat
Flask Chat Endpoint (chat.py)
    ↓ process_chat_message()
Service Layer (chat_service.py)
    ↓ translate() + store()
LangGraph Application (trip_graph.py)
    ↓ LLM Processing (Gemini 2.5 Flash)
External Services (Amadeus, Google Maps)
    ↓ structured results
Response Building (chat_service.py)
    ↓ translate_back() + store()
JSON Response
    ↓ 200 OK
Frontend App
```

## Key Files and Their Roles

### Core Flow Files
- `run.py` - Application entry point
- `app/__init__.py` - Flask application factory
- `app/api/chat.py` - Main chat endpoint
- `app/services/chat_service.py` - Request processing pipeline

### LLM and AI Files
- `app/agents/llm_init.py` - LLM initialization
- `app/agents/trip_graph.py` - LangGraph application
- `app/agents/planner.py` - Trip planning logic
- `app/agents/agents_list.py` - Agent definitions

### External Integration Files
- `app/external/amadeus/flight/flight_details.py` - Flight services
- `app/external/google_maps/accomdation.py` - Hotel services
- `app/external/google_maps/bus.py` - Bus services

### Storage and Config Files
- `app/database/chat_storage.py` - Chat persistence
- `app/config.py` - Application configuration
- `app/middleware/` - CORS and error handling

## Performance Considerations

### Caching Strategy
- Amadeus API tokens cached for validity period
- Location data (IATA codes) cached when possible
- Translation results not cached (language-specific)

### Async Operations
- External API calls are synchronous currently
- Could be optimized with async/await for better performance

### Rate Limiting
- Amadeus API has rate limits
- Google Maps API quotas apply
- Consider implementing request queuing for high load

## Security Considerations

### API Key Management
- All API keys stored in environment variables
- No hardcoded credentials in source code
- Consider key rotation strategy

### Input Validation
- User queries sanitized before LLM processing
- SQL injection protection in database operations
- XSS prevention in response formatting

### CORS Configuration
- Properly configured for frontend domain
- OPTIONS requests handled for preflight

## Deployment Architecture

### Development
```bash
python run.py
# Serves on http://0.0.0.0:8089
```

### Production
- Uses Procfile for deployment
- Environment-specific configuration
- Consider load balancing for scalability

This flow document provides a comprehensive overview of how requests travel through your travel planner application, from user input to LLM processing and back to the frontend.
