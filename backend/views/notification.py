from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Notification, User

notification_bp = Blueprint("notification_bp", __name__, url_prefix="/notification")

# Get all notifications for current user
@notification_bp.route("/", methods=["GET"])
@jwt_required()
def get_notifications():
    current_user_id = get_jwt_identity()
    
    # Query parameters for filtering
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    limit = request.args.get('limit', type=int)
    
    query = Notification.query.filter_by(recipient_id=current_user_id)
    
    if unread_only:
        query = query.filter_by(is_read=False)
    
    query = query.order_by(Notification.created_at.desc())
    
    if limit:
        query = query.limit(limit)
    
    notifications = query.all()
    
    notification_list = []
    for notif in notifications:
        notification_data = {
            "id": notif.id,
            "notification_type": notif.notification_type,
            "title": notif.title,
            "message": notif.message,
            "is_read": notif.is_read,
            "related_case_id": notif.related_case_id,
            "created_at": notif.created_at.isoformat()
        }
        notification_list.append(notification_data)
    
    return jsonify(notification_list), 200

# Get unread notification count
@notification_bp.route("/unread-count", methods=["GET"])
@jwt_required()
def get_unread_count():
    current_user_id = get_jwt_identity()
    
    count = Notification.query.filter_by(
        recipient_id=current_user_id,
        is_read=False
    ).count()
    
    return jsonify({"count": count}), 200

# Mark notification as read
@notification_bp.route("/<notification_id>/read", methods=["PATCH"])
@jwt_required()
def mark_as_read(notification_id):
    current_user_id = get_jwt_identity()
    
    notification = Notification.query.filter_by(
        id=notification_id,
        recipient_id=current_user_id
    ).first()
    
    if not notification:
        return jsonify({"error": "Notification not found"}), 404
    
    try:
        notification.is_read = True
        db.session.commit()
        return jsonify({"success": "Notification marked as read"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to mark as read"}), 400

# Mark all notifications as read
@notification_bp.route("/mark-all-read", methods=["PATCH"])
@jwt_required()
def mark_all_as_read():
    current_user_id = get_jwt_identity()
    
    try:
        unread_notifications = Notification.query.filter_by(
            recipient_id=current_user_id,
            is_read=False
        ).all()
        
        for notif in unread_notifications:
            notif.is_read = True
        
        db.session.commit()
        
        return jsonify({
            "success": "All notifications marked as read",
            "count": len(unread_notifications)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to mark notifications as read"}), 400

# Create notification (admin/system use)
@notification_bp.route("/", methods=["POST"])
@jwt_required()
def create_notification():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.user_type != 'admin':
        return jsonify({"error": "Only admins can create notifications"}), 403
    
    data = request.get_json()
    
    recipient_id = data.get("recipient_id")
    notification_type = data.get("notification_type")
    title = data.get("title")
    message = data.get("message")
    related_case_id = data.get("related_case_id")
    
    if not all([recipient_id, notification_type, title, message]):
        return jsonify({"error": "Recipient ID, type, title, and message are required"}), 400
    
    # Verify recipient exists
    recipient = User.query.get(recipient_id)
    if not recipient:
        return jsonify({"error": "Recipient not found"}), 404
    
    try:
        notification = Notification(
            recipient_id=recipient_id,
            notification_type=notification_type,
            title=title,
            message=message,
            related_case_id=related_case_id
        )
        
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            "success": "Notification created successfully",
            "notification_id": notification.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create notification: {str(e)}"}), 400

# Delete notification
@notification_bp.route("/<notification_id>", methods=["DELETE"])
@jwt_required()
def delete_notification(notification_id):
    current_user_id = get_jwt_identity()
    
    notification = Notification.query.filter_by(
        id=notification_id,
        recipient_id=current_user_id
    ).first()
    
    if not notification:
        return jsonify({"error": "Notification not found"}), 404
    
    try:
        db.session.delete(notification)
        db.session.commit()
        return jsonify({"success": "Notification deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete notification"}), 400

# Get notification by ID
@notification_bp.route("/<notification_id>", methods=["GET"])
@jwt_required()
def get_notification(notification_id):
    current_user_id = get_jwt_identity()
    
    notification = Notification.query.filter_by(
        id=notification_id,
        recipient_id=current_user_id
    ).first()
    
    if not notification:
        return jsonify({"error": "Notification not found"}), 404
    
    # Automatically mark as read when viewed
    if not notification.is_read:
        try:
            notification.is_read = True
            db.session.commit()
        except:
            db.session.rollback()
    
    notification_data = {
        "id": notification.id,
        "notification_type": notification.notification_type,
        "title": notification.title,
        "message": notification.message,
        "is_read": notification.is_read,
        "related_case_id": notification.related_case_id,
        "created_at": notification.created_at.isoformat()
    }
    
    # Include case info if available
    if notification.related_case_id and notification.related_case:
        notification_data["case"] = {
            "id": notification.related_case.id,
            "title": notification.related_case.title,
            "case_number": notification.related_case.case_number
        }
    
    return jsonify(notification_data), 200