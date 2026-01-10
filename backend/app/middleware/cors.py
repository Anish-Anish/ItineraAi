from flask_cors import CORS

def init_cors(app):
    """Initialize CORS for the Flask application"""
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type"],
            "supports_credentials": False,
            "max_age": 3600
        }
    })
    print(" CORS initialized")
