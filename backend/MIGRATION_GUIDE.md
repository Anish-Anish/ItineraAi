# Migration Guide: Old Structure → New Structure

## 🎯 Quick Start

### Running the New Application

**Option 1: Using the new structure (Recommended)**
```bash
cd /Users/anish/Desktop/trip/backend
python run.py
```

**Option 2: Using the old structure (Legacy - for comparison)**
```bash
cd /Users/anish/Desktop/trip/backend/fin_planner
python app.py
```

## 📊 File Mapping Reference

### Your Old Files → New Location

| Old File | New Location | Purpose |
|----------|--------------|---------|
| `fin_planner/app.py` | `app/api/*.py` + `app/__init__.py` | Split into blueprints |
| `fin_planner/agents.py` | `app/agents/agents.py` | No change needed |
| `fin_planner/trip_graph.py` | `app/agents/trip_graph.py` | No change needed |
| `fin_planner/planner.py` | `app/agents/planner.py` | No change needed |
| `fin_planner/re_planner.py` | `app/agents/re_planner.py` | No change needed |
| `fin_planner/llm_init.py` | `app/agents/llm_init.py` | No change needed |
| `fin_planner/db_config.py` | `app/database/db_config.py` | No change needed |
| `fin_planner/chat_storage.py` | `app/database/chat_storage.py` | No change needed |
| `fin_planner/utils.py` | `app/services/translation_service.py` | Refactored |
| `fin_planner/accomdation.py` | `app/external/google_maps/accomdation.py` | Moved |
| `fin_planner/bus.py` | `app/external/google_maps/bus.py` | Moved |
| `fin_planner/flight/` | `app/external/amadeus/flight/` | Moved |
| `fin_planner/api_flight_search.py` | `app/services/flight_service.py` + `app/api/flights.py` | Split |
| `fin_planner/api_hotels_search.py` | `app/services/hotel_service.py` + `app/api/hotels.py` | Split |
| `fin_planner/api_bus_routes.py` | `app/services/bus_service.py` + `app/api/buses.py` | Split |
| `fin_planner/api_enhance_plan.py` | `app/services/plan_service.py` + `app/api/plans.py` | Split |
| `fin_planner/api_summarize_plan.py` | `app/services/plan_service.py` + `app/api/plans.py` | Split |
| `fin_planner/api_finalize_plan.py` | `app/services/plan_service.py` + `app/api/plans.py` | Split |

## 🔧 What Changed?

### 1. **CORS is Now Properly Configured**
**Old way (manual OPTIONS handling):**
```python
@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return jsonify({'message': 'CORS preflight passed'}), 200
```

**New way (automatic via middleware):**
```python
# In app/middleware/cors.py - handles all CORS automatically
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

### 2. **Routes Split into Blueprints**
**Old way (everything in one file):**
```python
# app.py had 400+ lines with all routes
@app.route("/api/chat", methods=["POST"])
@app.route("/api/flights", methods=["POST"])
@app.route("/api/hotels", methods=["POST"])
# ... many more
```

**New way (organized by feature):**
```python
# app/api/chat.py
chat_bp = Blueprint('chat', __name__)
@chat_bp.route("/api/chat", methods=["POST"])

# app/api/flights.py
flights_bp = Blueprint('flights', __name__)
@flights_bp.route("/api/flights", methods=["POST"])
```

### 3. **Business Logic Separated from HTTP**
**Old way (mixed together):**
```python
@app.route('/api/flights', methods=['POST'])
def search_flights():
    data = request.get_json()  # HTTP stuff
    token = get_amadeus_token()  # Business logic
    flights = search_api()  # Business logic
    return jsonify(flights)  # HTTP stuff
```

**New way (clean separation):**
```python
# app/api/flights.py (HTTP only)
@flights_bp.route('/api/flights', methods=['POST'])
def search_flights_endpoint():
    data = request.get_json()
    flights = search_flights(...)  # Call service
    return jsonify(flights)

# app/services/flight_service.py (Business logic only)
def search_flights(origin, destination, date):
    token = get_amadeus_token()
    flights = search_api()
    return flights
```

## 🚀 Benefits of New Structure

### ✅ **Better Organization**
- Each file has a single, clear purpose
- Easy to find where code lives
- No more 400+ line files

### ✅ **Easier Testing**
```python
# Test business logic without HTTP
from app.services.flight_service import search_flights
result = search_flights("Delhi", "Mumbai", "2024-01-01")
```

### ✅ **Proper CORS**
- No more manual OPTIONS handling
- Consistent across all endpoints
- Fixes your frontend connection error

### ✅ **Scalability**
- Add new features without touching existing code
- Multiple developers can work simultaneously
- Clear boundaries between components

### ✅ **Maintainability**
- Bug in flights? Check `app/services/flight_service.py`
- Need to add endpoint? Add to `app/api/`
- Change database? Only touch `app/database/`

## 📝 How to Add New Features

### Example: Adding a "Train Search" Feature

**1. Create the service (business logic):**
```python
# app/services/train_service.py
def search_trains(origin, destination, date):
    # Your train search logic
    return trains
```

**2. Create the API endpoint:**
```python
# app/api/trains.py
from flask import Blueprint, request, jsonify
from app.services.train_service import search_trains

trains_bp = Blueprint('trains', __name__)

@trains_bp.route('/api/trains', methods=['POST'])
def search_trains_endpoint():
    data = request.get_json()
    trains = search_trains(data['from'], data['to'], data['date'])
    return jsonify({"trains": trains})
```

**3. Register the blueprint:**
```python
# app/__init__.py
from app.api.trains import trains_bp
app.register_blueprint(trains_bp)
```

Done! ✅

## 🔄 Import Changes

### Old Imports (from fin_planner)
```python
from utils import translate_auto_to_english
from chat_storage import store_chat_message
from trip_graph import langgraph_app
```

### New Imports (from app)
```python
from app.services.translation_service import translate_auto_to_english
from app.database.chat_storage import store_chat_message
from app.agents.trip_graph import langgraph_app
```

## 🎓 Understanding the Layers

```
┌─────────────────────────────────────────┐
│  Frontend (React)                       │
│  Makes HTTP requests                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  API Layer (app/api/)                   │
│  - Receives HTTP requests               │
│  - Validates input                      │
│  - Calls services                       │
│  - Returns HTTP responses               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Service Layer (app/services/)          │
│  - Business logic                       │
│  - Data processing                      │
│  - Calls external APIs                  │
│  - Calls agents                         │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌──────────────────┐
│  Agents       │   │  External APIs   │
│  (LangGraph)  │   │  (Google, etc)   │
└───────────────┘   └──────────────────┘
        │                   │
        └─────────┬─────────┘
                  ▼
        ┌──────────────────┐
        │  Database        │
        │  (MongoDB)       │
        └──────────────────┘
```

## 🐛 Troubleshooting

### Issue: Import errors
**Solution:** Make sure you're in the `backend/` directory and using the new import paths.

### Issue: CORS errors in frontend
**Solution:** The new structure has proper CORS configured. Just restart the server with `python run.py`.

### Issue: "Module not found"
**Solution:** Install dependencies: `pip install -r requirements.txt`

### Issue: Want to use old code temporarily
**Solution:** The old code is still in `fin_planner/` - you can run it with:
```bash
cd fin_planner
python app.py
```

## 📚 Next Steps

1. ✅ **Test the new structure** - Run `python run.py`
2. ✅ **Update your frontend** - No changes needed! Same API endpoints
3. ✅ **Gradually migrate** - Both old and new can run simultaneously
4. ✅ **Learn the patterns** - See how features are organized
5. ✅ **Add new features** - Follow the new structure

## 💡 Pro Tips

- **Keep the old code** for reference until you're comfortable
- **Test each endpoint** to ensure it works the same
- **Read the README.md** for detailed documentation
- **Follow the patterns** when adding new features
- **Ask questions** if something is unclear

---

**Remember:** The new structure does the SAME thing as the old code, just organized better! 🎉
