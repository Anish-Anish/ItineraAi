import os
from app import create_app

config_name = os.environ.get('FLASK_ENV', 'development')
app = create_app(config_name)

if __name__ == "__main__":
    try:
        port = int(os.environ.get("PORT", 8089))
        host = os.environ.get("HOST", "0.0.0.0")
        
        print(f" Starting Travel Planner API on {host}:{port}")
        print(f" Environment: {config_name}")
        print(f" API URL: http://{host}:{port}")
        
        app.run(
            host=host,
            port=port,
            debug=(config_name == 'development')
        )
    except Exception as e:
        print(f"❌ Application failed to start: {e}")
        import traceback
        traceback.print_exc()
