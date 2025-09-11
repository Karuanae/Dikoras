from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from models import db, Notification

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/')
@login_required
def list_notifications():
    """List user's notifications"""
    page = request.args.get('page', 1, type=int)
    
    notifications = Notification.query.filter_by(
        recipient_id=current_user.id
    ).order_by(Notification.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    
    # Mark all notifications as read
    unread_notifications = Notification.query.filter_by(
        recipient_id=current_user.id,
        is_read=False
    ).all()
    
    for notif in unread_notifications:
        notif.is_read = True
    
    try:
        db.session.commit()
    except:
        db.session.rollback()
    
    return render_template('notification/list.html', notifications=notifications)

@notification_bp.route('/<notification_id>/read', methods=['POST'])
@login_required
def mark_read(notification_id):
    """Mark notification as read"""
    notification = Notification.query.filter_by(
        id=notification_id, 
        recipient_id=current_user.id
    ).first_or_404()
    
    try:
        notification.is_read = True
        db.session.commit()
        return jsonify({'success': True})
    except:
        db.session.rollback()
        return jsonify({'error': 'Failed to mark as read'}), 500

@notification_bp.route('/api/unread-count')
@login_required
def api_unread_count():
    """API endpoint for unread notification count"""
    count = Notification.query.filter_by(
        recipient_id=current_user.id,
        is_read=False
    ).count()
    
    return jsonify({'count': count})