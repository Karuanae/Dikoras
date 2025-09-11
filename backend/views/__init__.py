from flask import Blueprint

from .auth import auth_bp
from .cases import cases_bp
from .lawyers import lawyers_bp
from .clients import clients_bp
from .admin import admin_bp

# Register blueprints here
def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(cases_bp)
    app.register_blueprint(lawyers_bp)
    app.register_blueprint(clients_bp)
    app.register_blueprint(admin_bp)
