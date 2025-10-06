from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_login import login_required, current_user
from models import db, Case, Chat, Notification, User
from datetime import datetime
import os
from werkzeug.utils import secure_filename

chat_bp = Blueprint('chat', __name__, url_prefix='/chat')

@chat_bp.route('/api/messages/<case_id>')
@jwt_required()
def api_messages(case_id):
    """API endpoint to get messages for a case"""
    current_user_id = get_jwt_identity()
    
    current_user = User.query.get(current_user_id)
    if not current_user:
        current_app.logger.warning(f"User not found for ID: {current_user_id}")
        return jsonify({'error': 'Authentication required'}), 401
    
    case = Case.query.get(case_id)
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
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
        'is_current_user': msg.sender_id == current_user.id,
        'is_read': msg.is_read,
        'attachment': msg.attachment  # Use correct field name
    } for msg in messages])

@chat_bp.route('/<case_id>/send', methods=['POST'])
@jwt_required()
def send_message(case_id):
    """Send a chat message (supports file attachments)"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401

    case = Case.query.get(case_id)
    if not case:
        return jsonify({'error': 'Case not found'}), 404

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
        data = request.get_json(force=True) if request.data else {}
        message_text = data.get('message')
        file = None

    if not message_text and not file:
        return jsonify({'error': 'Message or file required'}), 400

    attachment_path = None
    if file:
        # Save file to uploads/documents/chat_<case_id>_<timestamp>_<filename>
        uploads_dir = os.path.join('uploads', 'documents')
        os.makedirs(uploads_dir, exist_ok=True)
        filename = f"chat_{case_id}_{int(datetime.utcnow().timestamp())}_{secure_filename(file.filename)}"
        file_path = os.path.join(uploads_dir, filename)
        file.save(file_path)
        attachment_path = f"/{file_path}"

    try:
        # Create chat message - only use fields that exist in your model
        message = Chat(
            case_id=case_id,
            sender_id=current_user.id,
            message=message_text or '',  # Ensure message is not None
            attachment=attachment_path  # Use the correct field name from your model
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
                'attachment': message.attachment,  # Use correct field name
                'is_read': message.is_read
            }, room=f'case_{case_id}')

        return jsonify({
            'success': True,
            'message': {
                'id': message.id,
                'sender_name': current_user.get_full_name(),
                'message': message.message,
                'created_at': message.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                'attachment': message.attachment,  # Use correct field name
                'is_read': message.is_read
            }
        })
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error sending message: {str(e)}")
        return jsonify({'error': 'Failed to send message'}), 500

@chat_bp.route('/api/direct-chat-case', methods=['POST'])
@jwt_required()
def create_direct_chat_case():
    """Create a direct chat case for lawyer-client communication"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'Authentication required'}), 401
        
    if current_user.user_type != 'lawyer':
        return jsonify({'error': 'Only lawyers can create direct chat cases'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
        
    client_id = data.get('client_id')
    title = data.get('title', 'Direct Chat')
    
    if not client_id:
        return jsonify({'error': 'Client ID required'}), 400
    
    # Check if client exists
    client = User.query.filter_by(id=client_id, user_type='client').first()
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    # Check if direct chat case already exists
    existing_case = Case.query.filter_by(
        lawyer_id=current_user.id,
        client_id=client_id,
        status='active'
    ).first()
    
    if existing_case:
        return jsonify({
            'id': existing_case.id,
            'title': existing_case.title,
            'case_number': existing_case.case_number,
            'client_id': existing_case.client_id,
            'lawyer_id': existing_case.lawyer_id,
            'status': existing_case.status
        }), 200
    
    # Create new direct chat case
    new_case = Case(
        title=title,
        description='Direct chat between lawyer and client',
        legal_service=data.get('legal_service', 'Direct Consultation'),
        priority=data.get('priority', 'medium'),
        status='active',
        lawyer_id=current_user.id,
        client_id=client_id,
        case_number=f"CHAT-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
    )
    
    try:
        db.session.add(new_case)
        db.session.commit()
        return jsonify({
            'id': new_case.id,
            'title': new_case.title,
            'case_number': new_case.case_number,
            'client_id': new_case.client_id,
            'lawyer_id': new_case.lawyer_id,
            'status': new_case.status
        }), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating direct chat case: {str(e)}")
        return jsonify({'error': 'Failed to create chat case'}), 500

# Keep the original Flask-Login protected routes for template rendering
@chat_bp.route('/<case_id>')
@login_required
def chat_room(case_id):
    """Chat room for a specific case (for template rendering)"""
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