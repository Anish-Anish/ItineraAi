from flask import Flask
from app.config import config
from app.middleware.cors import init_cors
from app.middleware.error_handlers import init_error_handlers

def create_app(config_name='development'):

    app = Flask(__name__)
    
    app.config.from_object(config[config_name])
    
    print(f"Initializing Flask app in {config_name} mode")
    
    init_cors(app)
    init_error_handlers(app)
    
    from app.api.chat import chat_bp
    from app.api.conversations import conversations_bp
    from app.api.flights import flights_bp
    from app.api.hotels import hotels_bp
    from app.api.buses import buses_bp
    from app.api.plans import plans_bp
    from app.api.plans import plans_bp
    from app.api.follow_up import follow_up_gen
    from app.api.users import users_bp
    
    app.register_blueprint(chat_bp)
    app.register_blueprint(conversations_bp)
    app.register_blueprint(flights_bp)
    app.register_blueprint(hotels_bp)
    app.register_blueprint(buses_bp)
    app.register_blueprint(plans_bp)
    app.register_blueprint(follow_up_gen)
    app.register_blueprint(users_bp)
    
    print(" All blueprints registered")
    
    @app.route('/')
    def index():
        return {
            "status": "running",
            "message": "Travel Planner API",
            "version": "2.0"
        }
    
    @app.route('/health')
    def health():
        return {"status": "healthy"}, 200
    
    return app
