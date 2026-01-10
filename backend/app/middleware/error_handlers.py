from flask import jsonify
import traceback

def init_error_handlers(app):

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            "success": False,
            "error": "Bad Request",
            "message": str(error)
        }), 400
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "error": "Not Found",
            "message": "The requested resource was not found"
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        print(f"🔥 Internal Server Error: {error}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "Internal Server Error",
            "message": "An unexpected error occurred"
        }), 500
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        print(f"🔥 Unhandled Exception: {error}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "Server Error",
            "message": str(error)
        }), 500
    
    print("✅ Error handlers initialized")
