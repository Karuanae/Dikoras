from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Case, LegalService, LawyerRequest, Notification, Transaction, Invoice, Document
from datetime import datetime, date, timedelta
from decimal import Decimal
from decorators import lawyer_required 

lawyer_bp = Blueprint('lawyer', __name__, url_prefix='/lawyer')

@lawyer_bp.route('/pending-approval', methods=['GET'])
@jwt_required()
def pending_approval():
    """Pending approval status for lawyers"""
    current_user_id = get_jwt_identity()
    
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'status': user.approval_status,
        'message': f'Your account is {user.approval_status}'
    }), 200

@lawyer_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@lawyer_required
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
    lawyer = User.query.get(current_user_id)
    available_cases_count = 0
    if lawyer and lawyer.specializations:
        specialization_list = lawyer.specializations.split(',')
        available_cases_count = Case.query.filter(
            Case.status == 'open',
            Case.legal_service_id.in_([int(id) for id in specialization_list])
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
    
    lawyer = User.query.get(current_user_id)
    if not lawyer:
        return jsonify({'error': 'Profile not found'}), 404
    
    return jsonify({
        'profile': {
            'id': lawyer.id,
            'first_name': lawyer.first_name,
            'last_name': lawyer.last_name,
            'email': lawyer.email,
            'phone': lawyer.phone,
            'profile_picture': lawyer.profile_picture,
            'description': lawyer.description,
            'location': lawyer.location,
            'star_ratings': lawyer.star_ratings,
            'years_of_experience': lawyer.years_of_experience,
            'education': lawyer.education,
            'hourly_rate': float(lawyer.hourly_rate) if lawyer.hourly_rate else None,
            'approval_status': lawyer.approval_status,
            'specializations': lawyer.specializations.split(',') if lawyer.specializations else []
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
        lawyer = User.query.get(current_user_id)
        if not lawyer:
            return jsonify({'error': 'Profile not found'}), 404
        
        # Update fields
        if 'first_name' in data:
            lawyer.first_name = data['first_name']
        if 'last_name' in data:
            lawyer.last_name = data['last_name']
        if 'phone' in data:
            lawyer.phone = data['phone']
        if 'profile_picture' in data:
            lawyer.profile_picture = data['profile_picture']
        if 'description' in data:
            lawyer.description = data['description']
        if 'location' in data:
            lawyer.location = data['location']
        if 'years_of_experience' in data:
            lawyer.years_of_experience = data['years_of_experience']
        if 'education' in data:
            lawyer.education = data['education']
        if 'hourly_rate' in data:
            lawyer.hourly_rate = Decimal(str(data['hourly_rate'])) if data['hourly_rate'] else None
        if 'specializations' in data:
            lawyer.specializations = ','.join(map(str, data['specializations'])) if data['specializations'] else None
        
        lawyer.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'profile': {
                'id': lawyer.id,
                'first_name': lawyer.first_name,
                'last_name': lawyer.last_name,
                'email': lawyer.email,
                'phone': lawyer.phone,
                'profile_picture': lawyer.profile_picture,
                'description': lawyer.description,
                'location': lawyer.location,
                'years_of_experience': lawyer.years_of_experience,
                'education': lawyer.education,
                'hourly_rate': float(lawyer.hourly_rate) if lawyer.hourly_rate else None,
                'approval_status': lawyer.approval_status,
                'specializations': lawyer.specializations.split(',') if lawyer.specializations else []
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error updating profile: {str(e)}'}), 500
# Add this endpoint to your lawyer.py file (add it after the get_clients endpoint)

@lawyer_bp.route('/direct-chat-case', methods=['POST'])
@jwt_required()
@lawyer_required
def create_direct_chat_case():
    """Create a direct chat case for lawyer-client communication"""
    current_user_id = get_jwt_identity()
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
        lawyer_id=current_user_id,
        client_id=client_id,
        status='active'
    ).first()
    
    if existing_case:
        return jsonify({
            'id': existing_case.id,
            'title': existing_case.title,
            'case_number': existing_case.case_number,
            'client_id': existing_case.client_id,
            'client_name': client.get_full_name(),
            'lawyer_id': existing_case.lawyer_id,
            'status': existing_case.status,
            'legal_service': existing_case.legal_service.name if existing_case.legal_service else 'Direct Consultation',
            'priority': existing_case.priority
        }), 200
    
    # Create new direct chat case
    try:
        new_case = Case(
            title=title,
            description='Direct chat between lawyer and client',
            legal_service=data.get('legal_service', 'Direct Consultation'),
            priority=data.get('priority', 'medium'),
            status='active',
            lawyer_id=current_user_id,
            client_id=client_id,
            case_number=f"CHAT-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
        )
        
        db.session.add(new_case)
        db.session.commit()
        
        return jsonify({
            'id': new_case.id,
            'title': new_case.title,
            'case_number': new_case.case_number,
            'client_id': new_case.client_id,
            'client_name': client.get_full_name(),
            'lawyer_id': new_case.lawyer_id,
            'status': new_case.status,
            'legal_service': 'Direct Consultation',
            'priority': new_case.priority
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create chat case: {str(e)}'}), 500
@lawyer_bp.route('/cases', methods=['GET'])
@jwt_required()
@lawyer_required
def get_cases():
    """Get lawyer's cases"""
    current_user_id = get_jwt_identity()
    
    # Query parameters
    status_filter = request.args.get('status')
    priority_filter = request.args.get('priority')
    service_filter = request.args.get('service')
    
    query = Case.query.filter_by(lawyer_id=current_user_id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    if priority_filter:
        query = query.filter_by(priority=priority_filter)
    if service_filter:
        query = query.filter_by(legal_service_id=service_filter)
    
    cases = query.order_by(Case.created_at.desc()).all()
    
    cases_data = []
    for case in cases:
        case_data = {
            'id': case.id,
            'case_number': case.case_number,
            'title': case.title,
            'description': case.description,
            'status': case.status,
            'priority': case.priority,
            'budget': float(case.budget) if case.budget else None,
            'deadline': case.deadline.isoformat() if case.deadline else None,
            'created_at': case.created_at.isoformat(),
            'updated_at': case.updated_at.isoformat() if case.updated_at else None,
            'assigned_at': case.assigned_at.isoformat() if case.assigned_at else None,
            'resolved_at': case.resolved_at.isoformat() if case.resolved_at else None,
            'client_name': case.client.get_full_name() if case.client else 'Unknown Client',
            'client_email': case.client.email if case.client else None,
            'legal_service': case.legal_service.name if case.legal_service else None
        }
        cases_data.append(case_data)
    
    return jsonify(cases_data), 200

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
    
    case_data = {
        'id': case.id,
        'case_number': case.case_number,
        'title': case.title,
        'description': case.description,
        'status': case.status,
        'priority': case.priority,
        'budget': float(case.budget) if case.budget else None,
        'deadline': case.deadline.isoformat() if case.deadline else None,
        'created_at': case.created_at.isoformat(),
        'updated_at': case.updated_at.isoformat() if case.updated_at else None,
        'assigned_at': case.assigned_at.isoformat() if case.assigned_at else None,
        'resolved_at': case.resolved_at.isoformat() if case.resolved_at else None,
        'client': {
            'id': case.client.id,
            'name': case.client.get_full_name(),
            'email': case.client.email,
            'phone': case.client.phone
        } if case.client else None,
        'legal_service': {
            'id': case.legal_service.id,
            'name': case.legal_service.name,
            'description': case.legal_service.description
        } if case.legal_service else None,
        'documents': [{
            'id': doc.id,
            'title': doc.title,
            'document_type': doc.document_type,
            'file_name': doc.file_name,
            'file_size': doc.file_size,
            'created_at': doc.created_at.isoformat(),
            'uploaded_by': doc.uploaded_by.get_full_name() if doc.uploaded_by else 'Unknown'
        } for doc in documents],
        'transactions': [{
            'id': t.id,
            'amount': float(t.amount),
            'status': t.status,
            'type': t.transaction_type,
            'created_at': t.created_at.isoformat()
        } for t in transactions],
        'invoices': [{
            'id': i.id,
            'invoice_number': i.invoice_number,
            'amount': float(i.amount),
            'total_amount': float(i.total_amount),
            'status': i.status,
            'issue_date': i.issue_date.isoformat(),
            'due_date': i.due_date.isoformat() if i.due_date else None
        } for i in invoices]
    }
    
    return jsonify(case_data), 200

@lawyer_bp.route('/available-cases', methods=['GET'])
@jwt_required()
@lawyer_required
def get_available_cases():
    """Get available cases for lawyer's specializations"""
    current_user_id = get_jwt_identity()
    
    lawyer = User.query.get(current_user_id)
    if not lawyer or not lawyer.specializations:
        return jsonify([]), 200
    
    specialization_list = lawyer.specializations.split(',')
    specialization_ids = [int(id) for id in specialization_list if id.strip().isdigit()]
    
    if not specialization_ids:
        return jsonify([]), 200
    
    # Query parameters
    priority_filter = request.args.get('priority')
    service_filter = request.args.get('service')
    
    query = Case.query.filter(
        Case.status == 'open',
        Case.legal_service_id.in_(specialization_ids)
    )
    
    if priority_filter:
        query = query.filter_by(priority=priority_filter)
    
    if service_filter:
        query = query.filter_by(legal_service_id=service_filter)
    
    cases = query.order_by(Case.created_at.desc()).all()
    
    # Get lawyer's existing requests
    lawyer_request_case_ids = [req.case_id for req in LawyerRequest.query.filter_by(
        lawyer_id=current_user_id
    ).all()]
    
    cases_data = []
    for case in cases:
        case_data = {
            'id': case.id,
            'case_number': case.case_number,
            'title': case.title,
            'description': case.description,
            'priority': case.priority,
            'budget': float(case.budget) if case.budget else None,
            'deadline': case.deadline.isoformat() if case.deadline else None,
            'created_at': case.created_at.isoformat(),
            'client_name': case.client.get_full_name() if case.client else 'Unknown Client',
            'legal_service': case.legal_service.name if case.legal_service else None,
            'already_requested': case.id in lawyer_request_case_ids
        }
        cases_data.append(case_data)
    
    return jsonify(cases_data), 200

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
            message=data.get('message', ''),
            proposed_fee=Decimal(str(data.get('proposed_fee'))) if data.get('proposed_fee') else None,
            status='pending'
        )
        
        db.session.add(lawyer_request)
        
        # Create notification for client
        notification = Notification(
            recipient_id=case.client_id,
            notification_type='case_request',
            title='New Case Request',
            message=f'Lawyer {lawyer_request.lawyer.get_full_name()} has requested to handle your case "{case.title}"',
            related_case_id=case_id
        )
        db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Case request sent successfully',
            'request_id': lawyer_request.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error sending request: {str(e)}'}), 500

@lawyer_bp.route('/my-requests', methods=['GET'])
@jwt_required()
@lawyer_required
def get_my_requests():
    """Get lawyer's case requests"""
    current_user_id = get_jwt_identity()
    
    status_filter = request.args.get('status')
    
    query = LawyerRequest.query.filter_by(lawyer_id=current_user_id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    requests = query.order_by(LawyerRequest.created_at.desc()).all()
    
    requests_data = []
    for req in requests:
        request_data = {
            'id': req.id,
            'case_id': req.case_id,
            'case_title': req.case.title if req.case else 'Unknown Case',
            'case_description': req.case.description if req.case else '',
            'status': req.status,
            'message': req.message,
            'proposed_fee': float(req.proposed_fee) if req.proposed_fee else None,
            'created_at': req.created_at.isoformat(),
            'responded_at': req.responded_at.isoformat() if req.responded_at else None,
            'client_name': req.case.client.get_full_name() if req.case and req.case.client else 'Unknown Client'
        }
        requests_data.append(request_data)
    
    return jsonify(requests_data), 200

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
    valid_statuses = ['assigned', 'in_progress', 'resolved', 'closed']
    if new_status not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400
    
    try:
        old_status = case.status
        case.status = new_status
        case.updated_at = datetime.utcnow()
        
        if new_status == 'resolved' and old_status != 'resolved':
            case.resolved_at = datetime.utcnow()
        
        # Create notification for client
        notification = Notification(
            recipient_id=case.client_id,
            notification_type='case_status_update',
            title='Case Status Updated',
            message=f'Your case "{case.title}" status has been updated to {new_status.replace("_", " ").title()}',
            related_case_id=case_id
        )
        db.session.add(notification)
        
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
        return jsonify({'error': f'Error updating case status: {str(e)}'}), 500

@lawyer_bp.route('/invoices', methods=['GET'])
@jwt_required()
@lawyer_required
def get_invoices():
    """Get lawyer invoices"""
    current_user_id = get_jwt_identity()
    
    status_filter = request.args.get('status')
    
    query = Invoice.query.filter_by(lawyer_id=current_user_id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    invoices = query.order_by(Invoice.issue_date.desc()).all()
    
    invoices_data = []
    for invoice in invoices:
        invoice_data = {
            'id': invoice.id,
            'invoice_number': invoice.invoice_number,
            'case_id': invoice.case_id,
            'case_title': invoice.case.title if invoice.case else 'Unknown Case',
            'amount': float(invoice.amount),
            'tax_amount': float(invoice.tax_amount),
            'total_amount': float(invoice.total_amount),
            'status': invoice.status,
            'issue_date': invoice.issue_date.isoformat(),
            'due_date': invoice.due_date.isoformat() if invoice.due_date else None,
            'client_name': invoice.client.get_full_name() if invoice.client else 'Unknown Client'
        }
        invoices_data.append(invoice_data)
    
    return jsonify(invoices_data), 200

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
            'invoice_number': invoice.invoice_number,
            'case_id': invoice.case_id,
            'case_title': invoice.case.title if invoice.case else 'Unknown Case',
            'amount': float(invoice.amount),
            'tax_amount': float(invoice.tax_amount),
            'total_amount': float(invoice.total_amount),
            'description': invoice.description,
            'status': invoice.status,
            'issue_date': invoice.issue_date.isoformat(),
            'due_date': invoice.due_date.isoformat() if invoice.due_date else None,
            'client': {
                'id': invoice.client.id,
                'name': invoice.client.get_full_name(),
                'email': invoice.client.email,
                'phone': invoice.client.phone
            } if invoice.client else None
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
        return jsonify({'error': 'Case not found or not assigned to you'}), 404
    
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
            description=data.get('description', ''),
            due_date=due_date,
            status='draft'
        )
        
        db.session.add(invoice)
        db.session.commit()
        
        return jsonify({
            'message': 'Invoice created successfully',
            'invoice_id': invoice.id,
            'invoice_number': invoice.invoice_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error creating invoice: {str(e)}'}), 500

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
        invoice.issue_date = date.today()
        
        # Create notification for client
        notification = Notification(
            recipient_id=invoice.client_id,
            notification_type='invoice_sent',
            title='New Invoice Received',
            message=f'You have received a new invoice for case "{invoice.case.title}"',
            related_case_id=invoice.case_id
        )
        db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Invoice sent to client successfully',
            'invoice_id': invoice.id,
            'status': invoice.status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error sending invoice: {str(e)}'}), 500

@lawyer_bp.route('/transactions', methods=['GET'])
@jwt_required()
@lawyer_required
def get_transactions():
    """Get lawyer transactions"""
    current_user_id = get_jwt_identity()
    
    status_filter = request.args.get('status')
    
    query = Transaction.query.filter_by(lawyer_id=current_user_id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    transactions = query.order_by(Transaction.created_at.desc()).all()
    
    transactions_data = []
    for transaction in transactions:
        transaction_data = {
            'id': transaction.id,
            'case_id': transaction.case_id,
            'case_title': transaction.case.title if transaction.case else 'Unknown Case',
            'amount': float(transaction.amount),
            'status': transaction.status,
            'transaction_type': transaction.transaction_type,
            'created_at': transaction.created_at.isoformat(),
            'client_name': transaction.client.get_full_name() if transaction.client else 'Unknown Client'
        }
        transactions_data.append(transaction_data)
    
    return jsonify(transactions_data), 200

@lawyer_bp.route('/documents', methods=['GET'])
@jwt_required()
@lawyer_required
def get_documents():
    """Get lawyer documents"""
    current_user_id = get_jwt_identity()
    
    case_filter = request.args.get('case_id')
    doc_type_filter = request.args.get('type')
    
    query = Document.query.join(Case).filter(Case.lawyer_id == current_user_id)
    
    if case_filter:
        query = query.filter(Document.case_id == case_filter)
    
    if doc_type_filter:
        query = query.filter(Document.document_type == doc_type_filter)
    
    documents = query.order_by(Document.created_at.desc()).all()
    
    documents_data = []
    for doc in documents:
        document_data = {
            'id': doc.id,
            'case_id': doc.case_id,
            'case_title': doc.case.title if doc.case else 'Unknown Case',
            'title': doc.title,
            'document_type': doc.document_type,
            'file_name': doc.file_name,
            'file_size': doc.file_size,
            'created_at': doc.created_at.isoformat(),
            'uploaded_by': doc.uploaded_by.get_full_name() if doc.uploaded_by else 'Unknown'
        }
        documents_data.append(document_data)
    
    return jsonify(documents_data), 200

@lawyer_bp.route('/notifications', methods=['GET'])
@jwt_required()
@lawyer_required
def get_notifications():
    """Get lawyer notifications"""
    current_user_id = get_jwt_identity()
    
    notifications = Notification.query.filter_by(
        recipient_id=current_user_id
    ).order_by(Notification.created_at.desc()).all()
    
    notifications_data = [{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.notification_type,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat(),
        'related_case_id': n.related_case_id
    } for n in notifications]
    
    # Mark notifications as read
    unread_notifications = Notification.query.filter_by(
        recipient_id=current_user_id,
        is_read=False
    ).all()
    
    for notif in unread_notifications:
        notif.is_read = True
    
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        # Don't return error here, just log it
        print(f"Error marking notifications as read: {str(e)}")
    
    return jsonify(notifications_data), 200

@lawyer_bp.route('/stats', methods=['GET'])
@jwt_required()
@lawyer_required
def get_stats():
    """Get lawyer statistics"""
    current_user_id = get_jwt_identity()
    
    # Case statistics
    total_cases = Case.query.filter_by(lawyer_id=current_user_id).count()
    active_cases = Case.query.filter_by(lawyer_id=current_user_id).filter(
        Case.status.in_(['assigned', 'in_progress'])
    ).count()
    resolved_cases = Case.query.filter_by(lawyer_id=current_user_id, status='resolved').count()
    
    # Financial statistics
    total_earnings = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.lawyer_id == current_user_id,
        Transaction.status == 'completed'
    ).scalar() or 0
    
    pending_invoices = Invoice.query.filter_by(
        lawyer_id=current_user_id,
        status='sent'
    ).count()
    
    # Request statistics
    pending_requests = LawyerRequest.query.filter_by(
        lawyer_id=current_user_id,
        status='pending'
    ).count()
    
    # Notification statistics
    unread_notifications = Notification.query.filter_by(
        recipient_id=current_user_id,
        is_read=False
    ).count()
    
    # Available cases based on specializations
    lawyer = User.query.get(current_user_id)
    available_cases = 0
    if lawyer and lawyer.specializations:
        specialization_list = lawyer.specializations.split(',')
        available_cases = Case.query.filter(
            Case.status == 'open',
            Case.legal_service_id.in_([int(id) for id in specialization_list])
        ).count()
    
    stats = {
        'total_cases': total_cases,
        'active_cases': active_cases,
        'resolved_cases': resolved_cases,
        'total_earnings': float(total_earnings),
        'pending_invoices': pending_invoices,
        'pending_requests': pending_requests,
        'unread_notifications': unread_notifications,
        'available_cases': available_cases
    }
    
    return jsonify(stats), 200

@lawyer_bp.route('/clients', methods=['GET'])
@jwt_required()
@lawyer_required
def get_clients():
    """Get lawyer's clients"""
    current_user_id = get_jwt_identity()
    
    # Get cases assigned to this lawyer
    cases = Case.query.filter_by(lawyer_id=current_user_id).all()
    
    # Extract unique clients from cases
    client_ids = set(case.client_id for case in cases)
    clients = User.query.filter(User.id.in_(client_ids)).all()
    
    clients_data = []
    for client in clients:
        # Get cases count for this client
        client_cases = Case.query.filter_by(
            lawyer_id=current_user_id,
            client_id=client.id
        ).all()
        
        # Get active cases
        active_cases = [case for case in client_cases if case.status in ['assigned', 'in_progress']]
        
        clients_data.append({
            'id': client.id,
            'name': client.get_full_name(),
            'email': client.email,
            'phone': client.phone,
            'total_cases': len(client_cases),
            'active_cases': len(active_cases),
            'last_case_date': max([case.created_at for case in client_cases]).isoformat() if client_cases else None
        })
    
    return jsonify(clients_data), 200

# ADD THE MISSING ENDPOINTS FOR MESSAGES

@lawyer_bp.route('/messages', methods=['GET', 'OPTIONS'])
@jwt_required()
@lawyer_required
def get_lawyer_messages():
    """Get lawyer messages - placeholder endpoint"""
    
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    # Return empty messages data for now
    return jsonify({
        'unreadCount': 0,
        'messages': []
    }), 200

@lawyer_bp.route('/messages', methods=['POST'])
@jwt_required()
@lawyer_required
def send_lawyer_message():
    """Send message - placeholder endpoint"""
    data = request.get_json()
    
    # Placeholder implementation
    return jsonify({
        'success': True,
        'message': 'Message sent successfully',
        'message_id': 1
    }), 200

@lawyer_bp.route('/settings', methods=['GET'])
@jwt_required()
@lawyer_required
def get_lawyer_settings():
    """Get lawyer settings - alias for profile"""
    current_user_id = get_jwt_identity()
    
    lawyer = User.query.get(current_user_id)
    if not lawyer:
        return jsonify({'error': 'Profile not found'}), 404
    
    return jsonify({
        'settings': {
            'id': lawyer.id,
            'first_name': lawyer.first_name,
            'last_name': lawyer.last_name,
            'email': lawyer.email,
            'phone': lawyer.phone,
            'profile_picture': lawyer.profile_picture,
            'description': lawyer.description,
            'location': lawyer.location,
            'years_of_experience': lawyer.years_of_experience,
            'education': lawyer.education,
            'hourly_rate': float(lawyer.hourly_rate) if lawyer.hourly_rate else None,
            'specializations': lawyer.specializations.split(',') if lawyer.specializations else []
        }
    }), 200

@lawyer_bp.route('/settings', methods=['PUT'])
@jwt_required()
@lawyer_required
def update_lawyer_settings():
    """Update lawyer settings - alias for profile update"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        lawyer = User.query.get(current_user_id)
        if not lawyer:
            return jsonify({'error': 'Profile not found'}), 404
        
        # Update fields
        if 'first_name' in data:
            lawyer.first_name = data['first_name']
        if 'last_name' in data:
            lawyer.last_name = data['last_name']
        if 'phone' in data:
            lawyer.phone = data['phone']
        if 'profile_picture' in data:
            lawyer.profile_picture = data['profile_picture']
        if 'description' in data:
            lawyer.description = data['description']
        if 'location' in data:
            lawyer.location = data['location']
        if 'years_of_experience' in data:
            lawyer.years_of_experience = data['years_of_experience']
        if 'education' in data:
            lawyer.education = data['education']
        if 'hourly_rate' in data:
            lawyer.hourly_rate = Decimal(str(data['hourly_rate'])) if data['hourly_rate'] else None
        if 'specializations' in data:
            lawyer.specializations = ','.join(map(str, data['specializations'])) if data['specializations'] else None
        
        lawyer.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Settings updated successfully',
            'settings': {
                'id': lawyer.id,
                'first_name': lawyer.first_name,
                'last_name': lawyer.last_name,
                'email': lawyer.email,
                'phone': lawyer.phone,
                'profile_picture': lawyer.profile_picture,
                'description': lawyer.description,
                'location': lawyer.location,
                'years_of_experience': lawyer.years_of_experience,
                'education': lawyer.education,
                'hourly_rate': float(lawyer.hourly_rate) if lawyer.hourly_rate else None,
                'specializations': lawyer.specializations.split(',') if lawyer.specializations else []
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error updating settings: {str(e)}'}), 500