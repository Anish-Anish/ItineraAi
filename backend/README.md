# Travel Planner Backend API

A professional Flask-based backend for an AI-powered travel planning application.

## 📁 Project Structure

```
backend/
├── app/                        # Main application package
│   ├── api/                    # API route handlers (Blueprints)
│   │   ├── chat.py            # Chat endpoints
│   │   ├── conversations.py   # Conversation management
│   │   ├── flights.py         # Flight search
│   │   ├── hotels.py          # Hotel search
│   │   ├── buses.py           # Bus routes
│   │   └── plans.py           # Plan enhancement/finalization
│   │
│   ├── services/              # Business logic layer
│   │   ├── chat_service.py    # Chat processing
│   │   ├── flight_service.py  # Flight search logic
│   │   ├── hotel_service.py   # Hotel search logic
│   │   ├── bus_service.py     # Bus routes logic
│   │   ├── plan_service.py    # Plan operations
│   │   └── translation_service.py
│   │
│   ├── agents/                # LangGraph & AI agents
│   │   ├── agents.py
│   │   ├── trip_graph.py
│   │   ├── planner.py
│   │   └── re_planner.py
│   │
│   ├── external/              # External API clients
│   │   ├── amadeus/           # Flight API
│   │   ├── google_maps/       # Maps & Places API
│   │   └── google_translate/  # Translation API
│   │
│   ├── database/              # Database layer
│   │   ├── db_config.py
│   │   └── chat_storage.py
│   │
│   ├── utils/                 # Utility functions
│   ├── middleware/            # Flask middleware
│   │   ├── cors.py
│   │   └── error_handlers.py
│   │
│   ├── config.py              # Configuration
│   └── __init__.py            # App factory
│
├── fin_planner/               # Legacy code (to be deprecated)
├── run.py                     # Application entry point
├── requirements.txt           # Dependencies
└── .env                       # Environment variables
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- MongoDB
- Google Cloud credentials
- Amadeus API credentials

### Installation

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment variables:**
Create a `.env` file in the backend directory:
```env
PORT=8089
HOST=0.0.0.0
FLASK_ENV=development

MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB_NAME=travel_planner

GOOGLE_API_KEY=your_google_api_key
AMADEUS_API_KEY=your_amadeus_key
AMADEUS_API_SECRET=your_amadeus_secret
```

3. **Run the application:**
```bash
python run.py
```

The API will be available at `http://localhost:8089`

## 📡 API Endpoints

### Chat
- `POST /api/chat` - Process chat messages

### Conversations
- `GET /api/conversations` - List all conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/<id>` - Get conversation details
- `DELETE /api/conversations/<id>` - Delete conversation
- `GET /api/conversations/<id>/messages` - Get conversation messages

### Travel Services
- `POST /api/flights` - Search flights
- `POST /api/hotels` - Search hotels
- `POST /api/bus-routes` - Search bus routes

### Plan Management
- `POST /api/enhance` - Enhance travel plan
- `POST /api/summarize-plan` - Summarize plan
- `POST /api/finalize-plan` - Finalize plan

## 🏗️ Architecture

### Separation of Concerns
- **API Layer**: Handles HTTP requests/responses
- **Service Layer**: Contains business logic
- **Database Layer**: Manages data persistence
- **External Layer**: Integrates with third-party APIs
- **Agents Layer**: AI/LangGraph workflows

### Benefits
- ✅ Clean code organization
- ✅ Easy to test
- ✅ Scalable architecture
- ✅ Maintainable codebase
- ✅ Proper CORS handling
- ✅ Centralized error handling

## 🔧 Development

### Running in Development Mode
```bash
FLASK_ENV=development python run.py
```

### Running in Production Mode
```bash
FLASK_ENV=production python run.py
```

## 📝 Migration from Legacy Code

The old `fin_planner/app.py` has been refactored into:
- API routes → `app/api/`
- Business logic → `app/services/`
- External APIs → `app/external/`
- Middleware → `app/middleware/`

## 🐛 Troubleshooting

### CORS Issues
CORS is now properly configured in `app/middleware/cors.py`. All `/api/*` endpoints support CORS.

### Import Errors
Make sure you're running from the `backend/` directory and using `python run.py`.

## 📚 Additional Resources
- Flask Documentation: https://flask.palletsprojects.com/
- LangGraph: https://langchain-ai.github.io/langgraph/
