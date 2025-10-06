from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import User

def lawyer_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user or user.user_type != 'lawyer':  # Changed 'role' to 'user_type'
                return jsonify({"message": "Lawyer access required"}), 403
                
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"message": "Invalid token"}), 401
    return decorated_function

def client_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user or user.user_type != 'client':  # Changed 'role' to 'user_type'
                return jsonify({"message": "Client access required"}), 403
                
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"message": "Invalid token"}), 401
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user or user.user_type != 'admin':  # Changed 'role' to 'user_type'
                return jsonify({"message": "Admin access required"}), 403
                
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"message": "Invalid token"}), 401
    return decorated_function