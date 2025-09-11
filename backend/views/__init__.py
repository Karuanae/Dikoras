from flask import Blueprint

# Import all view modules
from .auth import auth_bp
from .admin import admin_bp
from .client import client_bp
from .lawyer import lawyer_bp
from .case import case_bp
from .chat import chat_bp
from .document import document_bp
from .transaction import transaction_bp
from .invoice import invoice_bp
from .notification import notification_bp
from .main import main_bp

def register_blueprints(app):
    """Register all blueprints with the Flask app"""
    
    # Main/Home routes
    app.register_blueprint(main_bp)
    
    # Authentication routes
    app.register_blueprint(auth_bp, url_prefix='/auth')
    
    # Admin routes
    app.register_blueprint(admin_bp, url_prefix='/admin')
    
    # Client routes
    app.register_blueprint(client_bp, url_prefix='/client')
    
    # Lawyer routes
    app.register_blueprint(lawyer_bp, url_prefix='/lawyer')
    
    # Case management routes
    app.register_blueprint(case_bp, url_prefix='/cases')
    
    # Chat/messaging routes
    app.register_blueprint(chat_bp, url_prefix='/chat')
    
    # Document management routes
    app.register_blueprint(document_bp, url_prefix='/documents')
    
    # Transaction routes
    app.register_blueprint(transaction_bp, url_prefix='/transactions')
    
    # Invoice routes
    app.register_blueprint(invoice_bp, url_prefix='/invoices')
    
    # Notification routes
    app.register_blueprint(notification_bp, url_prefix='/notifications')