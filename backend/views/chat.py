# chat.py
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, current_app
from flask_login import login_required, current_user
from models import db, Case, Chat, Notification
from datetime import datetime

chat_bp = Blueprint('chat', __name__, url_prefix='/chat')

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
    messages = Chat.query.filter_by(case_id=case_id).order_by(
        Chat.created_at.asc()
    ).all()
    
    # Mark messages as read
    unread_messages = Chat.query.filter(
        Chat.case_id == case_id,
        Chat.sender_id != current_user.id,
        Chat.is_read == False
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
    """Send a chat message (supports file attachments)"""
    case = Case.query.get_or_404(case_id)

    # Check permissions
    if current_user.user_type == 'client' and case.client_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    elif current_user.user_type == 'lawyer' and case.lawyer_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403

    # Accept both JSON and multipart/form-data
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        message_text = request.form.get('message')
        file = request.files.get('file')
    else:
        data = request.get_json(force=True)
        message_text = data.get('message')
        file = None

    if not message_text and not file:
        return jsonify({'error': 'Message or file required'}), 400

    attachment_url = None
    attachment_name = None
    if file:
        # Save file to uploads/documents/chat_<case_id>_<timestamp>_<filename>
        import os
        from werkzeug.utils import secure_filename
        uploads_dir = os.path.join('uploads', 'documents')
        os.makedirs(uploads_dir, exist_ok=True)
        filename = f"chat_{case_id}_{int(datetime.utcnow().timestamp())}_{secure_filename(file.filename)}"
        file_path = os.path.join(uploads_dir, filename)
        file.save(file_path)
        attachment_url = f"/{file_path}"
        attachment_name = file.filename

    try:
        message = Chat(
            case_id=case_id,
            sender_id=current_user.id,
            message=message_text,
            attachment_url=attachment_url,
            attachment_name=attachment_name
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

        # Emit socket event for real-time chat
        socketio = current_app.extensions.get('socketio')
        if socketio:
            socketio.emit('new_chat_message', {
                'case_id': case_id,
                'id': message.id,
                'sender_name': current_user.get_full_name(),
                'sender_id': current_user.id,
                'message': message.message,
                'created_at': message.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'attachment_url': message.attachment_url,
                'attachment_name': message.attachment_name
            }, room=f'case_{case_id}')

        return jsonify({
            'success': True,
            'message': {
                'id': message.id,
                'sender_name': current_user.get_full_name(),
                'message': message.message,
                'created_at': message.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'attachment_url': message.attachment_url,
                'attachment_name': message.attachment_name
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
    
    messages = Chat.query.filter_by(case_id=case_id).order_by(
        Chat.created_at.asc()
    ).all()
    
    return jsonify([{
        'id': msg.id,
        'sender_name': msg.sender.get_full_name(),
        'sender_id': msg.sender_id,
        'message': msg.message,
        'created_at': msg.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'is_current_user': msg.sender_id == current_user.id
    } for msg in messages])

@chat_bp.route("/", methods=["GET"])
def get_messages():
    user_id = request.args.get("user_id")
    messages = Chat.query.filter_by(user_id=user_id).all() if user_id else Chat.query.all()
    return jsonify([{
        "id": m.id,
        "user_id": m.user_id,
        "recipient_id": m.recipient_id,
        "message": m.message,
        "timestamp": m.timestamp
    } for m in messages]), 200
