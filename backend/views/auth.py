from flask import request, jsonify, Blueprint
from models import db, User, TokenBlocklist
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timezone

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/auth")

# Login
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    
    username = data.get("username")  # Can be username or email
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username/email and password are required"}), 400
     
    # Find user by username or email
    user = User.query.filter(
        (User.username == username) | (User.email == username)
    ).first()

    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.check_password(password):
        return jsonify({"error": "Invalid password"}), 401
    
    if not user.is_active:
        return jsonify({"error": "Account is deactivated. Contact support."}), 403
    
    # Check lawyer approval status
    if user.user_type == 'lawyer':
        if user.approval_status == 'pending':
            return jsonify({
                "error": "Lawyer account pending approval",
                "approval_status": user.approval_status,
                "message": "Your lawyer account is pending admin approval. You'll be notified once approved."
            }), 403
        elif user.approval_status == 'rejected':
            return jsonify({
                "error": "Lawyer application rejected",
                "approval_status": user.approval_status,
                "message": "Your lawyer application was rejected. You may update your profile and reapply."
            }), 403

    # Create access token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "user_type": user.user_type,
            "approval_status": user.approval_status
        }
    }), 200

# GET /login route for Flask-Login compatibility
@auth_bp.route("/login", methods=["GET"])
def login_get():
    return jsonify({"message": "Please log in via POST to this endpoint."}), 401

# Get current user info
@auth_bp.route("/current_user", methods=["GET"])
@jwt_required()
def fetch_current_user():
    current_user_id = get_jwt_identity()

    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "user_type": user.user_type,
        "phone": user.phone,
        "address": user.address,
        "is_active": user.is_active,
        "approval_status": user.approval_status,
        "created_at": user.created_at
    }
    
    # Add lawyer-specific data
    if user.user_type == 'lawyer':
        user_data.update({
            "years_of_experience": user.years_of_experience,
            "education": user.education,
            "hourly_rate": float(user.hourly_rate) if user.hourly_rate else None,
            "bio": user.bio,
            "specializations": user.specializations.split(',') if user.specializations else []
        })
    
    return jsonify(user_data), 200

# Logout (add token to blocklist)
@auth_bp.route("/logout", methods=["DELETE"])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    now = datetime.now(timezone.utc)

    # Add token to blocklist
    blocked_token = TokenBlocklist(jti=jti, created_at=now)
    db.session.add(blocked_token)
    db.session.commit()
    
    return jsonify({"success": "Successfully logged out"}), 200

# Refresh token (optional - for extending sessions)
@auth_bp.route("/refresh", methods=["POST"])
@jwt_required()
def refresh_token():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_active:
        return jsonify({"error": "User not found or inactive"}), 404
    
    # Check lawyer approval status
    if user.user_type == 'lawyer' and user.approval_status != 'approved':
        return jsonify({"error": "Lawyer account no longer approved"}), 403
    
    # Create new access token
    new_access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        "access_token": new_access_token
    }), 200

# Change password
@auth_bp.route("/change_password", methods=["PATCH"])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.get_json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")
    confirm_password = data.get("confirm_password")
    
    if not all([current_password, new_password, confirm_password]):
        return jsonify({"error": "Current password, new password, and confirmation are required"}), 400
    
    if not user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect"}), 401
    
    if new_password != confirm_password:
        return jsonify({"error": "New passwords do not match"}), 400
    
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters long"}), 400
    
    try:
        user.set_password(new_password)
        db.session.commit()
        return jsonify({"success": "Password changed successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to change password"}), 400

# Forgot password (simplified - just check if email exists)
@auth_bp.route("/forgot_password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email")
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    user = User.query.filter_by(email=email).first()
    
    # Always return success message for security (don't reveal if email exists)
    return jsonify({
        "success": "If an account with this email exists, a password reset link has been sent"
    }), 200

# Check authentication status
@auth_bp.route("/check_auth", methods=["GET"])
@jwt_required()
def check_auth():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.is_active:
        return jsonify({"authenticated": False, "error": "User not found or inactive"}), 401
    
    # Check lawyer approval status
    if user.user_type == 'lawyer' and user.approval_status != 'approved':
        return jsonify({
            "authenticated": False, 
            "error": "Lawyer account not approved",
            "approval_status": user.approval_status
        }), 403
    
    return jsonify({
        "authenticated": True,
        "user_type": user.user_type,
        "approval_status": user.approval_status
    }), 200