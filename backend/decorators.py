from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import jsonify
from models import User

def lawyer_required(f):
    """Decorator to ensure the user is a lawyer"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        
        # Check if user exists and is a lawyer
        user = User.query.filter_by(id=current_user_id, user_type='lawyer').first()
        if not user:
            return jsonify({'error': 'Lawyer access required'}), 403
        
        # Optional: Check if lawyer is approved
        if hasattr(user, 'approval_status') and user.approval_status != 'approved':
            return jsonify({'error': 'Account pending approval'}), 403
            
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to ensure the user is an admin"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        
        # Check if user exists and is an admin
        user = User.query.filter_by(id=current_user_id, user_type='admin').first()
        if not user:
            return jsonify({'error': 'Admin access required'}), 403
            
        return f(*args, **kwargs)
    return decorated_function

def client_required(f):
    """Decorator to ensure the user is a client"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        
        # Check if user exists and is a client
        user = User.query.filter_by(id=current_user_id, user_type='client').first()
        if not user:
            return jsonify({'error': 'Client access required'}), 403
            
        return f(*args, **kwargs)
    return decorated_function