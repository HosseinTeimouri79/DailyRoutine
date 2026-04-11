import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from core.db import close_connection, ensure_schema
from routes.auth import auth_bp
from routes.logs import logs_bp
from routes.reports import reports_bp
from routes.routines import routines_bp


load_dotenv()


def create_app():
    app = Flask(__name__)
    cors_origin = os.getenv("CORS_ORIGIN", "*")
    CORS(app, resources={r"/api/*": {"origins": cors_origin}})

    ensure_schema()

    app.register_blueprint(auth_bp)
    app.register_blueprint(routines_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(reports_bp)

    app.teardown_appcontext(close_connection)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "DailyRoutine API"})

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"message": "not found"}), 404

    @app.errorhandler(Exception)
    def handle_error(error):
        return jsonify({"message": str(error)}), 500

    return app


if __name__ == "__main__":
    application = create_app()
    port = int(os.getenv("PORT", "4000"))
    application.run(host="0.0.0.0", port=port, debug=True)
