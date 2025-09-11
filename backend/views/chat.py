# chat.py
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from models import db, Case, ChatMessage, Notification
from datetime import datetime

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/<case_id>')
@login_required
def chat_room(case_id):
    """Chat room for a specific case"""
    case = Case.query.get_or_404(case_id)
    
    # Check permissions
    if current_user.user_type == 'client' and case.client_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    elif current_user.user_type == 'lawyer' and case.lawyer_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    elif current_user.user_type not in ['client', 'lawyer', 'admin']:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    
    # Get messages
    messages = ChatMessage.query.filter_by(case_id=case_id).order_by(
        ChatMessage.created_at.asc()
    ).all()
    
    # Mark messages as read
    unread_messages = ChatMessage.query.filter(
        ChatMessage.case_id == case_id,
        ChatMessage.sender_id != current_user.id,
        ChatMessage.is_read == False
    ).all()
    
    for msg in unread_messages:
        msg.is_read = True
    
    try:
        db.session.commit()
    except:
        db.session.rollback()
    
    return render_template('chat/room.html', case=case, messages=messages)

@chat_bp.route('/<case_id>/send', methods=['POST'])
@login_required
def send_message(case_id):
    """Send a chat message"""
    case = Case.query.get_or_404(case_id)
    
    # Check permissions
    if current_user.user_type == 'client' and case.client_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    elif current_user.user_type == 'lawyer' and case.lawyer_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    message_text = request.json.get('message')
    if not message_text:
        return jsonify({'error': 'Message cannot be empty'}), 400
    
    try:
        message = ChatMessage(
            case_id=case_id,
            sender_id=current_user.id,
            message=message_text
        )
        db.session.add(message)
        
        # Create notification for the other party
        recipient_id = case.lawyer_id if current_user.id == case.client_id else case.client_id
        if recipient_id:
            notification = Notification(
                recipient_id=recipient_id,
                notification_type='new_message',
                title='New Message',
                message=f'You have a new message in case "{case.title}"',
                related_case_id=case_id
            )
            db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': {
                'id': message.id,
                'sender_name': current_user.get_full_name(),
                'message': message.message,
                'created_at': message.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to send message'}), 500

@chat_bp.route('/api/messages/<case_id>')
@login_required
def api_messages(case_id):
    """API endpoint to get messages for a case"""
    case = Case.query.get_or_404(case_id)
    
    # Check permissions
    if current_user.user_type == 'client' and case.client_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    elif current_user.user_type == 'lawyer' and case.lawyer_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    messages = ChatMessage.query.filter_by(case_id=case_id).order_by(
        ChatMessage.created_at.asc()
    ).all()
    
    return jsonify([{
        'id': msg.id,
        'sender_name': msg.sender.get_full_name(),
        'sender_id': msg.sender_id,
        'message': msg.message,
        'created_at': msg.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'is_current_user': msg.sender_id == current_user.id
    } for msg in messages])