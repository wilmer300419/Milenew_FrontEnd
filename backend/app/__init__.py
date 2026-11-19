from flask import Flask
from flask_cors import CORS

from .cli import register_cli
from .config import Config
from .db import close_db
from .routes.admin import admin_bp
from .routes.auth import auth_bp
from .routes.health import health_bp
from .routes.notifications import notifications_bp
from .routes.transit import transit_bp
from .routes.trips import trips_bp
from .routes.users import users_bp
from .routes.wallet import wallet_bp
from .utils.errors import register_error_handlers


def create_app(config_overrides=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    if config_overrides:
        app.config.update(config_overrides)

    if not app.config.get("SECRET_KEY"):
        raise RuntimeError("SECRET_KEY no está configurada. Revisa backend/.env")

    app.json.sort_keys = False
    app.json.ensure_ascii = False

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(transit_bp, url_prefix="/api/transit")
    app.register_blueprint(wallet_bp, url_prefix="/api/wallet")
    app.register_blueprint(trips_bp, url_prefix="/api/trips")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    register_error_handlers(app)
    register_cli(app)
    app.teardown_appcontext(close_db)

    return app
