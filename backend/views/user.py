
from flask import Flask, request, jsonify, Blueprint
from models import db, User, LegalService
from flask_mail import Message
from flask import current_app
from flask_mail import Mail
mail = Mail()

user_bp = Blueprint("user_bp", __name__, url_prefix="/user")

# List all pending lawyers (admin view)
@user_bp.route("/pending-lawyers", methods=["GET"])
def list_pending_lawyers():
    pending_lawyers = User.query.filter_by(user_type='lawyer', approval_status='pending').all()
    result = []
    for user in pending_lawyers:
        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "years_of_experience": user.years_of_experience,
            "education": user.education,
            "hourly_rate": float(user.hourly_rate) if user.hourly_rate else None,
            "bio": user.bio,
            "specializations": user.specializations.split(',') if user.specializations else [],
            "created_at": user.created_at
        })
    return jsonify(result), 200
@user_bp.route("/", methods=["POST"])
def create_user():
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    user_type = data.get("user_type", "client")  # default to client
    phone = data.get("phone")
    address = data.get("address")
    
    # Lawyer-specific fields
    years_of_experience = data.get("years_of_experience")
    education = data.get("education")
    hourly_rate = data.get("hourly_rate")
    bio = data.get("bio")
    specializations = data.get("specializations", [])  # List of service IDs

    # Validation
    if not all([username, email, password, first_name, last_name]):
        return jsonify({"error": "Username, email, password, first name and last name are required"}), 400
    
    if password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400
    
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400
    
    if user_type not in ['client', 'lawyer', 'admin']:
        return jsonify({"error": "Invalid user type"}), 400
    
    # Check for existing username/email
    username_exists = User.query.filter_by(username=username).first()
    email_exists = User.query.filter_by(email=email).first()

    if username_exists:
        return jsonify({"error": "Username already exists"}), 400

    if email_exists:
        return jsonify({"error": "Email already exists"}), 400

    # Additional validation for lawyers
    if user_type == 'lawyer':
        if not years_of_experience or not education:
            return jsonify({"error": "Years of experience and education are required for lawyers"}), 400
        
        if not specializations:
            return jsonify({"error": "At least one specialization is required for lawyers"}), 400

    try:
        # Create new user
        new_user = User(
            username=username, 
            email=email, 
            first_name=first_name,
            last_name=last_name,
            user_type=user_type,
            phone=phone,
            address=address,
            years_of_experience=int(years_of_experience) if years_of_experience else None,
            education=education,
            hourly_rate=float(hourly_rate) if hourly_rate else None,
            bio=bio,
            specializations=','.join(map(str, specializations)) if specializations else None
            # approval_status will be automatically set by the model's __init__ method based on user_type
        )
        
        # Set password using model method for consistency
        new_user.set_password(password)
        
        db.session.add(new_user)

        # Send welcome email
        try:
            subject = f"Welcome to Legal Services Platform"
            if user_type == 'lawyer':
                body = f"Hello {first_name},\n\nThank you for registering as a lawyer on our Legal Services Platform. Your account is pending approval from our admin team. We'll notify you once your account is approved.\n\nBest regards,\nLegal Services Platform Team"
            else:
                body = f"Hello {first_name},\n\nThank you for registering on our Legal Services Platform. You can now access our legal services and connect with qualified lawyers.\n\nBest regards,\nLegal Services Platform Team"
            
            msg = Message(
                subject=subject,
                recipients=[email],
                sender=current_app.config['MAIL_DEFAULT_SENDER'],
                body=body
            )
            mail.send(msg)
            
            # Commit after successful email
            db.session.commit()
            
            return jsonify({
                "success": "User created successfully",
                "user_id": new_user.id,
                "approval_required": user_type == 'lawyer'
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Failed to register user or send welcome email"}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 400

# Update user
@user_bp.route("/<user_id>", methods=["PATCH"])
def update_user(user_id):  
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
  
    # Update basic fields
    user.username = data.get("username", user.username)
    user.email = data.get("email", user.email)
    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)
    user.phone = data.get("phone", user.phone)
    user.address = data.get("address", user.address)
    user.is_active = data.get("is_active", user.is_active)
    
    # Update lawyer-specific fields
    if user.user_type == 'lawyer':
        user.years_of_experience = data.get("years_of_experience", user.years_of_experience)
        user.education = data.get("education", user.education)
        user.hourly_rate = data.get("hourly_rate", user.hourly_rate)
        user.bio = data.get("bio", user.bio)
        
        # Update specializations
        specializations = data.get("specializations")
        if specializations is not None:
            user.specializations = ','.join(map(str, specializations))
    
    # Admin-only updates
    approval_status = data.get("approval_status")
    if approval_status and approval_status in ['pending', 'approved', 'rejected']:
        user.approval_status = approval_status

    # Allow rejected lawyers to reapply by updating profile (set status to pending)
    if user.user_type == 'lawyer' and user.approval_status == 'rejected':
        # If lawyer updates profile, set status back to pending
        user.approval_status = 'pending'

    try:
        # Send update notification email
        msg = Message(
            subject="Profile Updated - Legal Services Platform",
            recipients=[user.email],
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            body=f"Hello {user.first_name},\n\nYour profile has been updated successfully on Legal Services Platform.\n\nBest regards,\nLegal Services Platform Team"
        )
        mail.send(msg)        
        
        db.session.commit()
        return jsonify({"success": "User updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update user"}), 400

# Get user by ID
@user_bp.route("/<user_id>", methods=["GET"])
def fetch_user_by_id(user_id):
    user = User.query.get(user_id)

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
        "created_at": user.created_at
    }
    
    # Add lawyer-specific data
    if user.user_type == 'lawyer':
        user_data.update({
            "years_of_experience": user.years_of_experience,
            "education": user.education,
            "hourly_rate": float(user.hourly_rate) if user.hourly_rate else None,
            "bio": user.bio,
            "specializations": user.specializations.split(',') if user.specializations else [],
            "approval_status": user.approval_status
        })
    
    return jsonify(user_data), 200

# Get all users with filtering
@user_bp.route("/", methods=["GET"])
def fetch_all_users():
    # Query parameters for filtering
    user_type = request.args.get('user_type')  # client, lawyer, admin
    approval_status = request.args.get('approval_status')  # pending, approved, rejected
    is_active = request.args.get('is_active')  # true, false
    
    query = User.query
    
    if user_type:
        query = query.filter(User.user_type == user_type)
    
    if approval_status:
        query = query.filter(User.approval_status == approval_status)
    
    if is_active is not None:
        active = is_active.lower() == 'true'
        query = query.filter(User.is_active == active)
    
    users = query.all()

    user_list = []
    for user in users:
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
                "specializations": user.specializations.split(',') if user.specializations else []
            })
        
        user_list.append(user_data)
        
    return jsonify(user_list), 200

# Delete user
@user_bp.route("/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({"success": "User deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete user"}), 400

# Approve lawyer
@user_bp.route("/<user_id>/approve", methods=["PATCH"])
def approve_lawyer(user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if user.user_type != 'lawyer':
        return jsonify({"error": "User is not a lawyer"}), 400
    
    if user.approval_status != 'pending':
        return jsonify({"error": "Lawyer is not pending approval"}), 400

    try:
        user.approval_status = 'approved'
        
        # Send approval email
        msg = Message(
            subject="Account Approved - Legal Services Platform",
            recipients=[user.email],
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            body=f"Hello {user.first_name},\n\nCongratulations! Your lawyer account has been approved. You can now access the platform and start accepting cases.\n\nBest regards,\nLegal Services Platform Team"
        )
        mail.send(msg)
        
        db.session.commit()
        return jsonify({"success": "Lawyer approved successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to approve lawyer"}), 400

# Reject lawyer
@user_bp.route("/<user_id>/reject", methods=["PATCH"])
def reject_lawyer(user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if user.user_type != 'lawyer':
        return jsonify({"error": "User is not a lawyer"}), 400
    
    data = request.get_json()
    rejection_reason = data.get("rejection_reason", "Your application did not meet our requirements")

    try:
        user.approval_status = 'rejected'
        
        # Send rejection email
        msg = Message(
            subject="Account Application - Legal Services Platform",
            recipients=[user.email],
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            body=f"Hello {user.first_name},\n\nThank you for your interest in joining our Legal Services Platform. Unfortunately, your lawyer account application has been declined.\n\nReason: {rejection_reason}\n\nYou may reapply with updated information.\n\nBest regards,\nLegal Services Platform Team"
        )
        mail.send(msg)
        
        db.session.commit()
        return jsonify({"success": "Lawyer application rejected"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to reject lawyer"}), 400