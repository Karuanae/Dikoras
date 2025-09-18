from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Case, LegalService, LawyerRequest, Notification, Transaction, Invoice, Document, User
from datetime import datetime, date, timedelta
from decimal import Decimal
from decorators import lawyer_required 

lawyer_bp = Blueprint('lawyer', __name__)

@lawyer_bp.route('/pending-approval', methods=['GET'])
@jwt_required()
def pending_approval():
    """Pending approval status for lawyers"""
    current_user_id = get_jwt_identity()
    
    # In a real implementation, you would check the user type and approval status
    # This is a simplified version
    return jsonify({
        'status': 'pending',
        'message': 'Your account is pending approval'
    }), 200

@lawyer_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@jwt_required()
def dashboard():
    """Lawyer dashboard data"""
    current_user_id = get_jwt_identity()
    
    # Get lawyer statistics
    total_cases = Case.query.filter_by(lawyer_id=current_user_id).count()
    active_cases = Case.query.filter_by(
        lawyer_id=current_user_id
    ).filter(Case.status.in_(['assigned', 'in_progress'])).count()
    
    resolved_cases = Case.query.filter_by(
        lawyer_id=current_user_id, 
        status='resolved'
    ).count()
    
    # Get available cases based on specializations
    # This would need to be implemented based on your data model
    available_cases_count = Case.query.filter(
        Case.status == 'open'
    ).count()
    
    # Get pending requests sent by this lawyer
    pending_requests = LawyerRequest.query.filter_by(
        lawyer_id=current_user_id,
        status='pending'
    ).count()
    
    # Get total earnings
    total_earnings = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.lawyer_id == current_user_id,
        Transaction.status == 'completed'
    ).scalar() or 0
    
    # Get recent notifications
    recent_notifications = Notification.query.filter_by(
        recipient_id=current_user_id
    ).order_by(Notification.created_at.desc()).limit(5).all()
    
    notifications_data = [{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.notification_type,
        'created_at': n.created_at.isoformat(),
        'is_read': n.is_read
    } for n in recent_notifications]
    
    return jsonify({
        'stats': {
            'total_cases': total_cases,
            'active_cases': active_cases,
            'resolved_cases': resolved_cases,
            'available_cases': available_cases_count,
            'pending_requests': pending_requests,
            'total_earnings': float(total_earnings)
        },
        'recent_notifications': notifications_data
    }), 200

@lawyer_bp.route('/profile', methods=['GET'])
@jwt_required()
@lawyer_required
def get_profile():
    """Get lawyer profile"""
    current_user_id = get_jwt_identity()
    
    # In a real implementation, you would fetch the lawyer's profile
    # This is a simplified version
    # Fetch actual lawyer profile from database
    lawyer = User.query.filter_by(id=current_user_id, user_type='lawyer').first()
    if not lawyer:
        return jsonify({'error': 'Profile not found'}), 404
    return jsonify({
        'profile': {
            'first_name': lawyer.first_name,
            'last_name': lawyer.last_name,
            'profile_picture': getattr(lawyer, 'profile_picture', None),
            'description': getattr(lawyer, 'bio', None),
            'location': getattr(lawyer, 'address', None),
            'star_ratings': getattr(lawyer, 'star_ratings', None),
            'years_of_experience': getattr(lawyer, 'years_of_experience', None),
            'education': getattr(lawyer, 'education', None),
            'hourly_rate': float(getattr(lawyer, 'hourly_rate', 0)) if getattr(lawyer, 'hourly_rate', None) else None,
            'approval_status': getattr(lawyer, 'approval_status', None)
        }
    }), 200

@lawyer_bp.route('/profile', methods=['PUT'])
@jwt_required()
@lawyer_required
def update_profile():
    """Update lawyer profile"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        # Update lawyer profile in database
        lawyer = User.query.filter_by(id=current_user_id, user_type='lawyer').first()
        if not lawyer:
            return jsonify({'error': 'Profile not found'}), 404
        lawyer.first_name = data.get('first_name', lawyer.first_name)
        lawyer.last_name = data.get('last_name', lawyer.last_name)
        lawyer.profile_picture = data.get('profile_picture', getattr(lawyer, 'profile_picture', None))
        lawyer.bio = data.get('description', getattr(lawyer, 'bio', None))
        lawyer.address = data.get('location', getattr(lawyer, 'address', None))
        lawyer.star_ratings = data.get('star_ratings', getattr(lawyer, 'star_ratings', None))
        lawyer.years_of_experience = data.get('years_of_experience', getattr(lawyer, 'years_of_experience', None))
        lawyer.education = data.get('education', getattr(lawyer, 'education', None))
        lawyer.hourly_rate = data.get('hourly_rate', getattr(lawyer, 'hourly_rate', None))
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': {
                'first_name': lawyer.first_name,
                'last_name': lawyer.last_name,
                'profile_picture': getattr(lawyer, 'profile_picture', None),
                'description': getattr(lawyer, 'bio', None),
                'location': getattr(lawyer, 'address', None),
                'star_ratings': getattr(lawyer, 'star_ratings', None),
                'years_of_experience': getattr(lawyer, 'years_of_experience', None),
                'education': getattr(lawyer, 'education', None),
                'hourly_rate': float(getattr(lawyer, 'hourly_rate', 0)) if getattr(lawyer, 'hourly_rate', None) else None,
                'approval_status': getattr(lawyer, 'approval_status', None)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Error updating profile'}), 500

@lawyer_bp.route('/cases', methods=['GET'])
@jwt_required()
@lawyer_required
def get_cases():
    """Get lawyer's cases"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status_filter = request.args.get('status')
    
    query = Case.query.filter_by(lawyer_id=current_user_id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    cases = query.order_by(Case.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    cases_data = [{
        'id': case.id,
        'title': case.title,
        'status': case.status,
        'priority': case.priority,
        'created_at': case.created_at.isoformat(),
        'updated_at': case.updated_at.isoformat() if case.updated_at else None
    } for case in cases.items]
    
    return jsonify({
        'cases': cases_data,
        'total': cases.total,
        'pages': cases.pages,
        'current_page': page
    }), 200

@lawyer_bp.route('/cases/<int:case_id>', methods=['GET'])
@jwt_required()
@lawyer_required
def get_case_detail(case_id):
    """Get case details"""
    current_user_id = get_jwt_identity()
    
    case = Case.query.filter_by(id=case_id, lawyer_id=current_user_id).first()
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    # Get case documents
    documents = Document.query.filter_by(case_id=case_id).order_by(
        Document.created_at.desc()
    ).all()
    
    # Get case transactions
    transactions = Transaction.query.filter_by(case_id=case_id).order_by(
        Transaction.created_at.desc()
    ).all()
    
    # Get case invoices
    invoices = Invoice.query.filter_by(case_id=case_id).order_by(
        Invoice.issue_date.desc()
    ).all()
    
    return jsonify({
        'case': {
            'id': case.id,
            'title': case.title,
            'description': case.description,
            'status': case.status,
            'priority': case.priority,
            'created_at': case.created_at.isoformat(),
            'updated_at': case.updated_at.isoformat() if case.updated_at else None
        },
        'documents': [{
            'id': doc.id,
            'name': doc.name,
            'type': doc.document_type,
            'created_at': doc.created_at.isoformat()
        } for doc in documents],
        'transactions': [{
            'id': t.id,
            'amount': float(t.amount),
            'status': t.status,
            'created_at': t.created_at.isoformat()
        } for t in transactions],
        'invoices': [{
            'id': i.id,
            'amount': float(i.amount),
            'status': i.status,
            'issue_date': i.issue_date.isoformat()
        } for i in invoices]
    }), 200

@lawyer_bp.route('/available-cases', methods=['GET'])
@jwt_required()
@lawyer_required
def get_available_cases():
    """Get available cases for lawyer's specializations"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    service_filter = request.args.get('service')
    priority_filter = request.args.get('priority')
    
    # Simplified implementation - would filter by specializations in real app
    query = Case.query.filter(Case.status == 'open')
    
    if service_filter:
        query = query.filter_by(legal_service_id=service_filter)
    
    if priority_filter:
        query = query.filter_by(priority=priority_filter)
    
    cases = query.order_by(Case.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    cases_data = [{
        'id': case.id,
        'title': case.title,
        'description': case.description,
        'priority': case.priority,
        'service': case.legal_service.name if case.legal_service else None,
        'created_at': case.created_at.isoformat()
    } for case in cases.items]
    
    return jsonify({
        'cases': cases_data,
        'total': cases.total,
        'pages': cases.pages,
        'current_page': page
    }), 200

@lawyer_bp.route('/cases/<int:case_id>/request', methods=['POST'])
@jwt_required()
@lawyer_required
def request_case(case_id):
    """Request to handle a case"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    case = Case.query.get(case_id)
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    # Check if case is still open
    if case.status != 'open':
        return jsonify({'error': 'This case is no longer available'}), 400
    
    # Check if lawyer already requested this case
    existing_request = LawyerRequest.query.filter_by(
        case_id=case_id,
        lawyer_id=current_user_id
    ).first()
    
    if existing_request:
        return jsonify({'error': 'You have already requested this case'}), 400
    
    try:
        # Create lawyer request
        lawyer_request = LawyerRequest(
            case_id=case_id,
            lawyer_id=current_user_id,
            message=data.get('message'),
            proposed_fee=Decimal(data.get('proposed_fee')) if data.get('proposed_fee') else None
        )
        db.session.add(lawyer_request)
        db.session.commit()
        
        return jsonify({
            'message': 'Case request sent successfully',
            'request_id': lawyer_request.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error sending request'}), 500

@lawyer_bp.route('/my-requests', methods=['GET'])
@jwt_required()
@lawyer_required
def get_my_requests():
    """Get lawyer's case requests"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status_filter = request.args.get('status')
    
    query = LawyerRequest.query.filter_by(lawyer_id=current_user_id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    requests = query.order_by(LawyerRequest.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    requests_data = [{
        'id': req.id,
        'case_id': req.case_id,
        'case_title': req.case.title if req.case else None,
        'status': req.status,
        'message': req.message,
        'proposed_fee': float(req.proposed_fee) if req.proposed_fee else None,
        'created_at': req.created_at.isoformat()
    } for req in requests.items]
    
    return jsonify({
        'requests': requests_data,
        'total': requests.total,
        'pages': requests.pages,
        'current_page': page
    }), 200

@lawyer_bp.route('/cases/<int:case_id>/status', methods=['PUT'])
@jwt_required()
@lawyer_required
def update_case_status(case_id):
    """Update case status"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    case = Case.query.filter_by(id=case_id, lawyer_id=current_user_id).first()
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    new_status = data.get('status')
    if new_status not in ['assigned', 'in_progress', 'resolved']:
        return jsonify({'error': 'Invalid status'}), 400
    
    try:
        old_status = case.status
        case.status = new_status
        case.updated_at = datetime.utcnow()
        
        if new_status == 'resolved' and old_status != 'resolved':
            case.resolved_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Case status updated successfully',
            'case': {
                'id': case.id,
                'status': case.status,
                'updated_at': case.updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error updating case status'}), 500

@lawyer_bp.route('/invoices', methods=['GET'])
@jwt_required()
@lawyer_required
def get_invoices():
    """Get lawyer invoices"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    status_filter = request.args.get('status')
    
    query = Invoice.query.filter_by(lawyer_id=current_user_id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    invoices = query.order_by(Invoice.issue_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    invoices_data = [{
        'id': invoice.id,
        'case_id': invoice.case_id,
        'case_title': invoice.case.title if invoice.case else None,
        'amount': float(invoice.amount),
        'total_amount': float(invoice.total_amount),
        'status': invoice.status,
        'issue_date': invoice.issue_date.isoformat(),
        'due_date': invoice.due_date.isoformat() if invoice.due_date else None
    } for invoice in invoices.items]
    
    return jsonify({
        'invoices': invoices_data,
        'total': invoices.total,
        'pages': invoices.pages,
        'current_page': page
    }), 200

@lawyer_bp.route('/invoices/<int:invoice_id>', methods=['GET'])
@jwt_required()
@lawyer_required
def get_invoice_detail(invoice_id):
    """Get invoice details"""
    current_user_id = get_jwt_identity()
    
    invoice = Invoice.query.filter_by(id=invoice_id, lawyer_id=current_user_id).first()
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    
    return jsonify({
        'invoice': {
            'id': invoice.id,
            'case_id': invoice.case_id,
            'case_title': invoice.case.title if invoice.case else None,
            'amount': float(invoice.amount),
            'tax_amount': float(invoice.tax_amount),
            'total_amount': float(invoice.total_amount),
            'description': invoice.description,
            'status': invoice.status,
            'issue_date': invoice.issue_date.isoformat(),
            'due_date': invoice.due_date.isoformat() if invoice.due_date else None
        }
    }), 200

@lawyer_bp.route('/invoices', methods=['POST'])
@jwt_required()
@lawyer_required
def create_invoice():
    """Create a new invoice"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    case_id = data.get('case_id')
    case = Case.query.filter_by(id=case_id, lawyer_id=current_user_id).first()
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    try:
        amount = Decimal(str(data.get('amount')))
        tax_amount = Decimal(str(data.get('tax_amount', 0)))
        due_days = int(data.get('due_days', 30))
        due_date = date.today() + timedelta(days=due_days)
        
        invoice = Invoice(
            case_id=case_id,
            client_id=case.client_id,
            lawyer_id=current_user_id,
            amount=amount,
            tax_amount=tax_amount,
            total_amount=amount + tax_amount,
            description=data.get('description'),
            due_date=due_date,
            status='draft'
        )
        
        db.session.add(invoice)
        db.session.commit()
        
        return jsonify({
            'message': 'Invoice created successfully',
            'invoice_id': invoice.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error creating invoice'}), 500

@lawyer_bp.route('/invoices/<int:invoice_id>/send', methods=['POST'])
@jwt_required()
@lawyer_required
def send_invoice(invoice_id):
    """Send invoice to client"""
    current_user_id = get_jwt_identity()
    
    invoice = Invoice.query.filter_by(id=invoice_id, lawyer_id=current_user_id).first()
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    
    if invoice.status != 'draft':
        return jsonify({'error': 'Invoice cannot be sent'}), 400
    
    try:
        invoice.status = 'sent'
        db.session.commit()
        
        return jsonify({
            'message': 'Invoice sent to client successfully',
            'invoice_id': invoice.id,
            'status': invoice.status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error sending invoice'}), 500

@lawyer_bp.route('/transactions', methods=['GET'])
@jwt_required()
@lawyer_required
def get_transactions():
    """Get lawyer transactions"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    status_filter = request.args.get('status')
    
    query = Transaction.query.filter_by(lawyer_id=current_user_id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    transactions = query.order_by(Transaction.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    transactions_data = [{
        'id': t.id,
        'case_id': t.case_id,
        'case_title': t.case.title if t.case else None,
        'amount': float(t.amount),
        'status': t.status,
        'created_at': t.created_at.isoformat()
    } for t in transactions.items]
    
    return jsonify({
        'transactions': transactions_data,
        'total': transactions.total,
        'pages': transactions.pages,
        'current_page': page
    }), 200

@lawyer_bp.route('/documents', methods=['GET'])
@jwt_required()
@lawyer_required
def get_documents():
    """Get lawyer documents"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    case_filter = request.args.get('case')
    doc_type_filter = request.args.get('type')
    
    query = Document.query.join(Case).filter(Case.lawyer_id == current_user_id)
    
    if case_filter:
        query = query.filter(Document.case_id == case_filter)
    
    if doc_type_filter:
        query = query.filter(Document.document_type == doc_type_filter)
    
    documents = query.order_by(Document.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    documents_data = [{
        'id': doc.id,
        'case_id': doc.case_id,
        'case_title': doc.case.title if doc.case else None,
        'name': doc.name,
        'type': doc.document_type,
        'created_at': doc.created_at.isoformat()
    } for doc in documents.items]
    
    return jsonify({
        'documents': documents_data,
        'total': documents.total,
        'pages': documents.pages,
        'current_page': page
    }), 200

@lawyer_bp.route('/notifications', methods=['GET'])
@jwt_required()
@lawyer_required
def get_notifications():
    """Get lawyer notifications"""
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    notifications = Notification.query.filter_by(
        recipient_id=current_user_id
    ).order_by(Notification.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    notifications_data = [{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.notification_type,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat()
    } for n in notifications.items]
    
    # Mark notifications as read
    unread_notifications = Notification.query.filter_by(
        recipient_id=current_user_id,
        is_read=False
    ).all()
    
    for notif in unread_notifications:
        notif.is_read = True
    
    try:
        db.session.commit()
    except:
        db.session.rollback()
    
    return jsonify({
        'notifications': notifications_data,
        'total': notifications.total,
        'pages': notifications.pages,
        'current_page': page
    }), 200

@lawyer_bp.route('/stats', methods=['GET'])
@jwt_required()
@lawyer_required
def get_stats():
    """Get lawyer statistics"""
    current_user_id = get_jwt_identity()
    
    stats = {
        'total_cases': Case.query.filter_by(lawyer_id=current_user_id).count(),
        'active_cases': Case.query.filter_by(lawyer_id=current_user_id).filter(
            Case.status.in_(['assigned', 'in_progress'])
        ).count(),
        'resolved_cases': Case.query.filter_by(lawyer_id=current_user_id, status='resolved').count(),
        'total_earnings': float(db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.lawyer_id == current_user_id,
            Transaction.status == 'completed'
        ).scalar() or 0),
        'pending_requests': LawyerRequest.query.filter_by(
            lawyer_id=current_user_id,
            status='pending'
        ).count(),
        'unread_notifications': Notification.query.filter_by(
            recipient_id=current_user_id,
            is_read=False
        ).count(),
        'available_cases': Case.query.filter(
            Case.status == 'open'
        ).count()  # Simplified - would filter by specializations in real app
    }
    
    return jsonify(stats), 200