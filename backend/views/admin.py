from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import (db, User, Case, LegalService, Transaction, 
                   Invoice, Document, Notification, ActivityLog, LawyerRequest, Chat)
from datetime import datetime, timedelta
from sqlalchemy import func, desc
from functools import wraps

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(f):
    """Decorator to ensure only admins can access these routes"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.user_type != 'admin':
            return jsonify({'error': 'Access denied. Admin privileges required.'}), 403
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    """Admin dashboard with overview statistics"""
    # User statistics
    total_users = User.query.count()
    total_clients = User.query.filter_by(user_type='client').count()
    total_lawyers = User.query.filter_by(user_type='lawyer').count()
    pending_lawyers = User.query.filter_by(user_type='lawyer', approval_status='pending').count()
    approved_lawyers = User.query.filter_by(user_type='lawyer', approval_status='approved').count()
    rejected_lawyers = User.query.filter_by(user_type='lawyer', approval_status='rejected').count()
    
    # Case statistics
    total_cases = Case.query.count()
    open_cases = Case.query.filter_by(status='open').count()
    active_cases = Case.query.filter(Case.status.in_(['assigned', 'in_progress'])).count()
    resolved_cases = Case.query.filter_by(status='resolved').count()
    closed_cases = Case.query.filter_by(status='closed').count()
    
    # Financial statistics
    total_transactions = Transaction.query.count()
    completed_transactions = Transaction.query.filter_by(status='completed').count()
    pending_transactions = Transaction.query.filter_by(status='pending').count()
    failed_transactions = Transaction.query.filter_by(status='failed').count()
    
    total_revenue = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.status == 'completed'
    ).scalar() or 0
    
    total_invoices = Invoice.query.count()
    pending_invoices = Invoice.query.filter_by(status='sent').count()
    paid_invoices = Invoice.query.filter_by(status='paid').count()
    overdue_invoices = Invoice.query.filter_by(status='overdue').count()
    draft_invoices = Invoice.query.filter_by(status='draft').count()
    
    # Recent activities
    recent_cases = Case.query.order_by(desc(Case.created_at)).limit(10).all()
    recent_transactions = Transaction.query.order_by(desc(Transaction.created_at)).limit(10).all()
    recent_users = User.query.order_by(desc(User.created_at)).limit(10).all()
    recent_activities = ActivityLog.query.order_by(desc(ActivityLog.created_at)).limit(15).all()
    
    # Monthly statistics for charts (last 6 months)
    current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_stats = []
    
    for i in range(6):
        month_start = current_month - timedelta(days=30*i)
        month_end = month_start + timedelta(days=30)
        
        cases_count = Case.query.filter(
            Case.created_at >= month_start,
            Case.created_at < month_end
        ).count()
        
        revenue = db.session.query(func.sum(Transaction.amount)).filter(
            Transaction.created_at >= month_start,
            Transaction.created_at < month_end,
            Transaction.status == 'completed'
        ).scalar() or 0
        
        users_count = User.query.filter(
            User.created_at >= month_start,
            User.created_at < month_end
        ).count()
        
        monthly_stats.append({
            'month': month_start.strftime('%Y-%m'),
            'month_name': month_start.strftime('%B %Y'),
            'cases': cases_count,
            'revenue': float(revenue),
            'users': users_count
        })
    
    dashboard_data = {
        'user_stats': {
            'total_users': total_users,
            'total_clients': total_clients,
            'total_lawyers': total_lawyers,
            'pending_lawyers': pending_lawyers,
            'approved_lawyers': approved_lawyers,
            'rejected_lawyers': rejected_lawyers
        },
        'case_stats': {
            'total_cases': total_cases,
            'open_cases': open_cases,
            'active_cases': active_cases,
            'resolved_cases': resolved_cases,
            'closed_cases': closed_cases
        },
        'financial_stats': {
            'total_transactions': total_transactions,
            'completed_transactions': completed_transactions,
            'pending_transactions': pending_transactions,
            'failed_transactions': failed_transactions,
            'total_revenue': float(total_revenue),
            'total_invoices': total_invoices,
            'pending_invoices': pending_invoices,
            'paid_invoices': paid_invoices,
            'overdue_invoices': overdue_invoices,
            'draft_invoices': draft_invoices
        },
        'recent_activity': {
            'recent_cases': [{
                'id': case.id,
                'case_number': case.case_number,
                'title': case.title,
                'status': case.status,
                'priority': case.priority,
                'client_name': case.client.get_full_name(),
                'lawyer_name': case.lawyer.get_full_name() if case.lawyer else None,
                'created_at': case.created_at.isoformat()
            } for case in recent_cases],
            'recent_transactions': [{
                'id': t.id,
                'transaction_number': t.transaction_number,
                'amount': float(t.amount),
                'status': t.status,
                'transaction_type': t.transaction_type,
                'client_name': t.client.get_full_name() if t.client else None,
                'lawyer_name': t.lawyer.get_full_name() if t.lawyer else None,
                'created_at': t.created_at.isoformat()
            } for t in recent_transactions],
            'recent_users': [{
                'id': user.id,
                'username': user.username,
                'full_name': user.get_full_name(),
                'user_type': user.user_type,
                'approval_status': user.approval_status,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat()
            } for user in recent_users],
            'recent_activities': [{
                'id': log.id,
                'user_name': log.user.get_full_name(),
                'action': log.action,
                'description': log.description,
                'created_at': log.created_at.isoformat()
            } for log in recent_activities]
        },
        'monthly_stats': list(reversed(monthly_stats))  # Most recent first
    }
    
    return jsonify(dashboard_data), 200

@admin_bp.route('/lawyers', methods=['GET'])
@admin_required
def lawyers():
    """Get all lawyers with filtering and pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    status_filter = request.args.get('status')  # pending, approved, rejected
    search = request.args.get('search', '')
    
    query = User.query.filter_by(user_type='lawyer')
    
    if status_filter:
        query = query.filter(User.approval_status == status_filter)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term)) |
            (User.email.ilike(search_term)) |
            (User.username.ilike(search_term))
        )
    
    lawyers_pagination = query.order_by(desc(User.created_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    lawyers_data = [{
        'id': lawyer.id,
        'username': lawyer.username,
        'email': lawyer.email,
        'first_name': lawyer.first_name,
        'last_name': lawyer.last_name,
        'full_name': lawyer.get_full_name(),
        'phone': lawyer.phone,
        'address': lawyer.address,
        'approval_status': lawyer.approval_status,
        'years_of_experience': lawyer.years_of_experience,
        'education': lawyer.education,
        'hourly_rate': float(lawyer.hourly_rate) if lawyer.hourly_rate else None,
        'bio': lawyer.bio,
        'specializations': lawyer.specializations.split(',') if lawyer.specializations else [],
        'is_active': lawyer.is_active,
        'created_at': lawyer.created_at.isoformat()
    } for lawyer in lawyers_pagination.items]
    
    return jsonify({
        'lawyers': lawyers_data,
        'pagination': {
            'page': lawyers_pagination.page,
            'pages': lawyers_pagination.pages,
            'per_page': lawyers_pagination.per_page,
            'total': lawyers_pagination.total,
            'has_prev': lawyers_pagination.has_prev,
            'has_next': lawyers_pagination.has_next,
            'prev_num': lawyers_pagination.prev_num,
            'next_num': lawyers_pagination.next_num
        },
        'filters': {
            'current_status': status_filter,
            'current_search': search
        }
    }), 200

@admin_bp.route('/lawyers/<int:lawyer_id>', methods=['GET'])
@admin_required
def lawyer_detail(lawyer_id):
    """Get detailed lawyer information"""
    lawyer = User.query.filter_by(id=lawyer_id, user_type='lawyer').first()
    
    if not lawyer:
        return jsonify({'error': 'Lawyer not found'}), 404
    
    # Get lawyer's cases
    lawyer_cases = Case.query.filter_by(lawyer_id=lawyer.id).order_by(desc(Case.created_at)).all()
    
    # Get lawyer's earnings
    total_earnings = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.lawyer_id == lawyer.id,
        Transaction.status == 'completed'
    ).scalar() or 0
    
    # Get case statistics
    case_stats = {
        'total_cases': len(lawyer_cases),
        'open_cases': len([c for c in lawyer_cases if c.status == 'open']),
        'assigned_cases': len([c for c in lawyer_cases if c.status == 'assigned']),
        'in_progress_cases': len([c for c in lawyer_cases if c.status == 'in_progress']),
        'resolved_cases': len([c for c in lawyer_cases if c.status == 'resolved']),
        'closed_cases': len([c for c in lawyer_cases if c.status == 'closed'])
    }
    
    lawyer_data = {
        'id': lawyer.id,
        'username': lawyer.username,
        'email': lawyer.email,
        'first_name': lawyer.first_name,
        'last_name': lawyer.last_name,
        'full_name': lawyer.get_full_name(),
        'phone': lawyer.phone,
        'address': lawyer.address,
        'approval_status': lawyer.approval_status,
        'years_of_experience': lawyer.years_of_experience,
        'education': lawyer.education,
        'hourly_rate': float(lawyer.hourly_rate) if lawyer.hourly_rate else None,
        'bio': lawyer.bio,
        'specializations': lawyer.specializations.split(',') if lawyer.specializations else [],
        'is_active': lawyer.is_active,
        'created_at': lawyer.created_at.isoformat(),
        'total_earnings': float(total_earnings),
        'case_stats': case_stats,
        'recent_cases': [{
            'id': case.id,
            'case_number': case.case_number,
            'title': case.title,
            'status': case.status,
            'priority': case.priority,
            'client_name': case.client.get_full_name(),
            'created_at': case.created_at.isoformat(),
            'budget': float(case.budget) if case.budget else None
        } for case in lawyer_cases[:10]]  # Last 10 cases
    }
    
    return jsonify(lawyer_data), 200

@admin_bp.route('/lawyers/<int:lawyer_id>/approve', methods=['POST'])
@admin_required
def approve_lawyer(lawyer_id):
    """Approve lawyer registration"""
    current_user_id = get_jwt_identity()
    lawyer = User.query.filter_by(id=lawyer_id, user_type='lawyer').first()
    
    if not lawyer:
        return jsonify({'error': 'Lawyer not found'}), 404
    
    if lawyer.approval_status != 'pending':
        return jsonify({'error': 'This lawyer has already been processed'}), 400
    
    try:
        lawyer.approval_status = 'approved'
        
        # Create notification for lawyer
        notification = Notification(
            recipient_id=lawyer.id,
            notification_type='lawyer_approved',
            title='Account Approved',
            message='Congratulations! Your lawyer account has been approved and you can now access the platform.'
        )
        db.session.add(notification)
        
        # Log activity
        activity = ActivityLog(
            user_id=current_user_id,
            action='update',
            description=f'Approved lawyer registration for {lawyer.get_full_name()}',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string
        )
        db.session.add(activity)
        
        db.session.commit()
        
        return jsonify({
            'success': 'Lawyer approved successfully',
            'lawyer_id': lawyer_id,
            'approval_status': lawyer.approval_status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to approve lawyer: {str(e)}'}), 400

@admin_bp.route('/lawyers/<int:lawyer_id>/reject', methods=['POST'])
@admin_required
def reject_lawyer(lawyer_id):
    """Reject lawyer registration"""
    current_user_id = get_jwt_identity()
    lawyer = User.query.filter_by(id=lawyer_id, user_type='lawyer').first()
    
    if not lawyer:
        return jsonify({'error': 'Lawyer not found'}), 404
    
    if lawyer.approval_status != 'pending':
        return jsonify({'error': 'This lawyer has already been processed'}), 400
    
    data = request.get_json() or {}
    rejection_reason = data.get('rejection_reason', 'Application did not meet our requirements')
    
    try:
        lawyer.approval_status = 'rejected'
        
        # Create notification for lawyer
        notification = Notification(
            recipient_id=lawyer.id,
            notification_type='lawyer_rejected',
            title='Account Application Rejected',
            message=f'Your lawyer account application has been rejected. Reason: {rejection_reason}'
        )
        db.session.add(notification)
        
        # Log activity
        activity = ActivityLog(
            user_id=current_user_id,
            action='update',
            description=f'Rejected lawyer registration for {lawyer.get_full_name()} - Reason: {rejection_reason}',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string
        )
        db.session.add(activity)
        
        db.session.commit()
        
        return jsonify({
            'success': 'Lawyer rejected successfully',
            'lawyer_id': lawyer_id,
            'approval_status': lawyer.approval_status,
            'rejection_reason': rejection_reason
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to reject lawyer: {str(e)}'}), 400

@admin_bp.route('/clients', methods=['GET'])
@admin_required
def clients():
    """Get all clients with filtering and pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    search = request.args.get('search', '')
    is_active = request.args.get('is_active')
    
    query = User.query.filter_by(user_type='client')
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term)) |
            (User.email.ilike(search_term)) |
            (User.username.ilike(search_term))
        )
    
    if is_active is not None:
        active_status = is_active.lower() == 'true'
        query = query.filter(User.is_active == active_status)
    
    clients_pagination = query.order_by(desc(User.created_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    clients_data = [{
        'id': client.id,
        'username': client.username,
        'email': client.email,
        'first_name': client.first_name,
        'last_name': client.last_name,
        'full_name': client.get_full_name(),
        'phone': client.phone,
        'address': client.address,
        'is_active': client.is_active,
        'approval_status': client.approval_status,
        'created_at': client.created_at.isoformat()
    } for client in clients_pagination.items]
    
    return jsonify({
        'clients': clients_data,
        'pagination': {
            'page': clients_pagination.page,
            'pages': clients_pagination.pages,
            'per_page': clients_pagination.per_page,
            'total': clients_pagination.total,
            'has_prev': clients_pagination.has_prev,
            'has_next': clients_pagination.has_next,
            'prev_num': clients_pagination.prev_num,
            'next_num': clients_pagination.next_num
        },
        'filters': {
            'current_search': search,
            'is_active': is_active
        }
    }), 200

@admin_bp.route('/clients/<int:client_id>', methods=['GET'])
@admin_required
def client_detail(client_id):
    """Get detailed client information"""
    client = User.query.filter_by(id=client_id, user_type='client').first()
    
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    # Get client's cases
    client_cases = Case.query.filter_by(client_id=client_id).order_by(desc(Case.created_at)).all()
    
    # Get client's spending
    total_spent = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.client_id == client_id,
        Transaction.status == 'completed'
    ).scalar() or 0
    
    # Get case statistics
    case_stats = {
        'total_cases': len(client_cases),
        'open_cases': len([c for c in client_cases if c.status == 'open']),
        'assigned_cases': len([c for c in client_cases if c.status == 'assigned']),
        'in_progress_cases': len([c for c in client_cases if c.status == 'in_progress']),
        'resolved_cases': len([c for c in client_cases if c.status == 'resolved']),
        'closed_cases': len([c for c in client_cases if c.status == 'closed'])
    }
    
    client_data = {
        'id': client.id,
        'username': client.username,
        'email': client.email,
        'first_name': client.first_name,
        'last_name': client.last_name,
        'full_name': client.get_full_name(),
        'phone': client.phone,
        'address': client.address,
        'is_active': client.is_active,
        'approval_status': client.approval_status,
        'created_at': client.created_at.isoformat(),
        'total_spent': float(total_spent),
        'case_stats': case_stats,
        'recent_cases': [{
            'id': case.id,
            'case_number': case.case_number,
            'title': case.title,
            'status': case.status,
            'priority': case.priority,
            'lawyer_name': case.lawyer.get_full_name() if case.lawyer else None,
            'created_at': case.created_at.isoformat(),
            'budget': float(case.budget) if case.budget else None
        } for case in client_cases[:10]]  # Last 10 cases
    }
    
    return jsonify(client_data), 200

@admin_bp.route('/cases', methods=['GET'])
@admin_required
def cases():
    """Get all cases with filtering and pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    status_filter = request.args.get('status')
    priority_filter = request.args.get('priority')
    service_filter = request.args.get('service_id', type=int)
    search = request.args.get('search', '')
    
    query = Case.query.join(User, Case.client_id == User.id)
    
    if status_filter:
        query = query.filter(Case.status == status_filter)
    
    if priority_filter:
        query = query.filter(Case.priority == priority_filter)
    
    if service_filter:
        query = query.filter(Case.legal_service_id == service_filter)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Case.title.ilike(search_term)) |
            (Case.case_number.ilike(search_term)) |
            (Case.description.ilike(search_term)) |
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term))
        )
    
    cases_pagination = query.order_by(desc(Case.created_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Get legal services for filters
    services = LegalService.query.filter_by(is_active=True).all()
    
    cases_data = [{
        'id': case.id,
        'case_number': case.case_number,
        'title': case.title,
        'description': case.description,
        'status': case.status,
        'priority': case.priority,
        'budget': float(case.budget) if case.budget else None,
        'deadline': case.deadline.isoformat() if case.deadline else None,
        'client': {
            'id': case.client.id,
            'name': case.client.get_full_name(),
            'email': case.client.email
        },
        'lawyer': {
            'id': case.lawyer.id,
            'name': case.lawyer.get_full_name(),
            'email': case.lawyer.email
        } if case.lawyer else None,
        'legal_service': {
            'id': case.legal_service.id,
            'name': case.legal_service.name
        } if case.legal_service else None,
        'created_at': case.created_at.isoformat(),
        'updated_at': case.updated_at.isoformat(),
        'assigned_at': case.assigned_at.isoformat() if case.assigned_at else None,
        'resolved_at': case.resolved_at.isoformat() if case.resolved_at else None
    } for case in cases_pagination.items]
    
    return jsonify({
        'cases': cases_data,
        'pagination': {
            'page': cases_pagination.page,
            'pages': cases_pagination.pages,
            'per_page': cases_pagination.per_page,
            'total': cases_pagination.total,
            'has_prev': cases_pagination.has_prev,
            'has_next': cases_pagination.has_next,
            'prev_num': cases_pagination.prev_num,
            'next_num': cases_pagination.next_num
        },
        'filters': {
            'current_status': status_filter,
            'current_priority': priority_filter,
            'current_service': service_filter,
            'current_search': search
        },
        'services': [{
            'id': s.id,
            'name': s.name
        } for s in services]
    }), 200

@admin_bp.route('/cases/<int:case_id>', methods=['GET'])
@admin_required
def case_detail(case_id):
    """Get detailed case information"""
    case = Case.query.get(case_id)
    
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    # Get related data
    documents = Document.query.filter_by(case_id=case_id).all()
    transactions = Transaction.query.filter_by(case_id=case_id).all()
    invoices = Invoice.query.filter_by(case_id=case_id).all()
    lawyer_requests = LawyerRequest.query.filter_by(case_id=case_id).all()
    messages_count = Chat.query.filter_by(case_id=case_id).count()
    
    case_data = {
        'id': case.id,
        'case_number': case.case_number,
        'title': case.title,
        'description': case.description,
        'status': case.status,
        'priority': case.priority,
        'budget': float(case.budget) if case.budget else None,
        'deadline': case.deadline.isoformat() if case.deadline else None,
        'client': {
            'id': case.client.id,
            'name': case.client.get_full_name(),
            'email': case.client.email,
            'phone': case.client.phone
        },
        'lawyer': {
            'id': case.lawyer.id,
            'name': case.lawyer.get_full_name(),
            'email': case.lawyer.email,
            'phone': case.lawyer.phone
        } if case.lawyer else None,
        'legal_service': {
            'id': case.legal_service.id,
            'name': case.legal_service.name,
            'description': case.legal_service.description
        } if case.legal_service else None,
        'created_at': case.created_at.isoformat(),
        'updated_at': case.updated_at.isoformat(),
        'assigned_at': case.assigned_at.isoformat() if case.assigned_at else None,
        'resolved_at': case.resolved_at.isoformat() if case.resolved_at else None,
        'documents': [{
            'id': doc.id,
            'title': doc.title,
            'document_type': doc.document_type,
            'file_path': doc.file_path,
            'is_confidential': doc.is_confidential,
            'uploaded_by': doc.uploaded_by.get_full_name(),
            'created_at': doc.created_at.isoformat()
        } for doc in documents],
        'transactions': [{
            'id': t.id,
            'transaction_number': t.transaction_number,
            'amount': float(t.amount),
            'status': t.status,
            'transaction_type': t.transaction_type,
            'description': t.description,
            'payment_method': t.payment_method,
            'created_at': t.created_at.isoformat()
        } for t in transactions],
        'invoices': [{
            'id': inv.id,
            'invoice_number': inv.invoice_number,
            'amount': float(inv.amount),
            'total_amount': float(inv.total_amount),
            'status': inv.status,
            'issue_date': inv.issue_date.isoformat(),
            'due_date': inv.due_date.isoformat()
        } for inv in invoices],
        'lawyer_requests': [{
            'id': req.id,
            'lawyer_name': req.lawyer.get_full_name(),
            'message': req.message,
            'proposed_fee': float(req.proposed_fee) if req.proposed_fee else None,
            'status': req.status,
            'created_at': req.created_at.isoformat()
        } for req in lawyer_requests],
        'messages_count': messages_count
    }
    
    return jsonify(case_data), 200

@admin_bp.route('/cases/<int:case_id>/assign-lawyers', methods=['POST', 'OPTIONS'])
def assign_lawyers_to_case(case_id):
    """Assign one or more lawyers to a case and notify them"""
    
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    # For POST requests, check JWT and admin privileges
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        from flask_jwt_extended import decode_token
        decoded_token = decode_token(token)
        current_user_id = decoded_token['sub']
        
    except Exception as e:
        return jsonify({'error': 'Invalid token', 'details': str(e)}), 401
    
    user = User.query.get(current_user_id)
    if not user or user.user_type != 'admin':
        return jsonify({'error': 'Access denied. Admin privileges required.'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
        
    lawyer_ids = data.get('lawyer_ids', [])
    message = data.get('message', 'You have been assigned to a new case.')
    
    print(f"🔧 DEBUG: Starting assignment - Case {case_id} to lawyers {lawyer_ids}")
    
    # Get case with proper locking to prevent race conditions
    case = Case.query.filter_by(id=case_id).with_for_update().first()
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    print(f"📋 DEBUG: Found case - ID: {case.id}, Title: '{case.title}', Current Lawyer: {case.lawyer_id}, Status: {case.status}")
    
    assigned = []
    errors = []
    
    for lawyer_id in lawyer_ids:
        try:
            lawyer_id = int(lawyer_id)
            lawyer = User.query.get(lawyer_id)
            
            if not lawyer:
                errors.append(f"Lawyer with ID {lawyer_id} not found")
                continue
                
            print(f"👤 DEBUG: Found lawyer {lawyer_id} - {lawyer.get_full_name()} (Type: {lawyer.user_type}, Status: {lawyer.approval_status})")
            
            if lawyer.user_type != 'lawyer':
                errors.append(f"User {lawyer_id} is not a lawyer")
                continue
                
            if lawyer.approval_status != 'approved':
                errors.append(f"Lawyer {lawyer_id} is not approved")
                continue
            
            # CRITICAL: Update the case with the lawyer - SIMPLIFIED APPROACH
            print(f"🔄 DEBUG: Updating case {case_id} - Setting lawyer_id to {lawyer_id}, status to 'assigned'")
            
            # Direct assignment - no LawyerRequest for admin assignments
            case.lawyer_id = lawyer_id
            case.status = 'assigned'
            case.assigned_at = datetime.utcnow()
            case.updated_at = datetime.utcnow()
            
            # Create notification for lawyer
            notification = Notification(
                recipient_id=lawyer_id,
                notification_type='case_assignment',
                title='New Case Assignment',
                message=f'You have been assigned to case "{case.title}" by admin.',
                related_case_id=case_id
            )
            db.session.add(notification)
            
            # Create notification for client
            client_notification = Notification(
                recipient_id=case.client_id,
                notification_type='case_assignment',
                title='Case Assigned to Lawyer',
                message=f'Your case "{case.title}" has been assigned to lawyer {lawyer.get_full_name()}.',
                related_case_id=case_id
            )
            db.session.add(client_notification)
            
            assigned.append({
                'id': lawyer_id,
                'name': lawyer.get_full_name()
            })
            
            print(f"✅ DEBUG: Successfully prepared assignment for lawyer {lawyer_id}")
            
        except Exception as e:
            error_msg = f"Error assigning lawyer {lawyer_id}: {str(e)}"
            errors.append(error_msg)
            print(f"❌ DEBUG: {error_msg}")
            import traceback
            traceback.print_exc()
            continue
    
    try:
        if assigned:
            print(f"💾 DEBUG: Committing {len(assigned)} assignment(s) to database...")
            db.session.commit()
            print(f"🎉 DEBUG: Successfully committed assignment for case {case_id}")
            
            # VERIFY: Query the case again to confirm changes
            updated_case = Case.query.get(case_id)
            print(f"🔍 DEBUG: Verification - Case {case_id} now has:")
            print(f"   - lawyer_id: {updated_case.lawyer_id}")
            print(f"   - status: {updated_case.status}")
            print(f"   - assigned_at: {updated_case.assigned_at}")
            
            # Check how many cases this lawyer now has
            for assignment in assigned:
                lawyer_cases_count = Case.query.filter_by(lawyer_id=assignment['id']).count()
                print(f"📊 DEBUG: Lawyer {assignment['id']} ({assignment['name']}) now has {lawyer_cases_count} total cases")
        else:
            print("⚠️ DEBUG: No assignments to commit")
            db.session.rollback()
        
        response_data = {
            'success': True,
            'message': f'Successfully assigned {len(assigned)} lawyer(s) to the case',
            'assigned_lawyers': assigned,
            'errors': errors if errors else None,
            'debug': {
                'case_id': case_id,
                'final_lawyer_id': updated_case.lawyer_id if assigned else None,
                'final_status': updated_case.status if assigned else None,
                'assigned_at': updated_case.assigned_at.isoformat() if assigned and updated_case.assigned_at else None
            }
        }
        
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:5173')
        return response, 200
        
    except Exception as e:
        db.session.rollback()
        error_msg = f'Database error: {str(e)}'
        print(f"💥 DEBUG: {error_msg}")
        import traceback
        traceback.print_exc()
        
        response = jsonify({
            'error': error_msg,
            'assigned_lawyers': [],
            'errors': errors
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:5173')
        return response, 500
@admin_bp.route('/cases/<int:case_id>/verify', methods=['GET'])
@jwt_required()
def verify_case_assignment(case_id):
    """Verify case assignment status"""
    case = Case.query.get(case_id)
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    # Get lawyer info if assigned
    lawyer_info = None
    if case.lawyer_id:
        lawyer = User.query.get(case.lawyer_id)
        if lawyer:
            lawyer_info = {
                'id': lawyer.id,
                'name': lawyer.get_full_name(),
                'email': lawyer.email
            }
    
    return jsonify({
        'case': {
            'id': case.id,
            'title': case.title,
            'lawyer_id': case.lawyer_id,
            'status': case.status,
            'assigned_at': case.assigned_at.isoformat() if case.assigned_at else None,
            'created_at': case.created_at.isoformat()
        },
        'lawyer': lawyer_info,
        'total_cases_for_lawyer': Case.query.filter_by(lawyer_id=case.lawyer_id).count() if case.lawyer_id else 0
    }), 200
@admin_bp.route('/transactions', methods=['GET'])
@admin_required
def transactions():
    """Get all transactions with filtering and pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status_filter = request.args.get('status')
    type_filter = request.args.get('type')
    
    query = Transaction.query
    
    if status_filter:
        query = query.filter(Transaction.status == status_filter)
    
    if type_filter:
        query = query.filter(Transaction.transaction_type == type_filter)
    
    transactions_pagination = query.order_by(desc(Transaction.created_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    transactions_data = [{
        'id': t.id,
        'transaction_number': t.transaction_number,
        'amount': float(t.amount),
        'status': t.status,
        'transaction_type': t.transaction_type,
        'description': t.description,
        'payment_method': t.payment_method,
        'payment_reference': t.payment_reference,
        'case': {
            'id': t.case.id,
            'case_number': t.case.case_number,
            'title': t.case.title
        } if t.case else None,
        'client': {
            'id': t.client.id,
            'name': t.client.get_full_name()
        } if t.client else None,
        'lawyer': {
            'id': t.lawyer.id,
            'name': t.lawyer.get_full_name()
        } if t.lawyer else None,
        'created_at': t.created_at.isoformat(),
        'completed_at': t.completed_at.isoformat() if t.completed_at else None
    } for t in transactions_pagination.items]
    
    return jsonify({
        'transactions': transactions_data,
        'pagination': {
            'page': transactions_pagination.page,
            'pages': transactions_pagination.pages,
            'per_page': transactions_pagination.per_page,
            'total': transactions_pagination.total,
            'has_prev': transactions_pagination.has_prev,
            'has_next': transactions_pagination.has_next,
            'prev_num': transactions_pagination.prev_num,
            'next_num': transactions_pagination.next_num
        },
        'filters': {
            'current_status': status_filter,
            'current_type': type_filter
        }
    }), 200

@admin_bp.route('/legal-services', methods=['GET'])
@admin_required
def legal_services():
    """Get all legal services"""
    services = LegalService.query.order_by(LegalService.name).all()
    
    services_data = [{
        'id': service.id,
        'name': service.name,
        'description': service.description,
        'icon': service.icon,
        'is_active': service.is_active,
        'created_at': service.created_at.isoformat(),
        'cases_count': Case.query.filter_by(legal_service_id=service.id).count()
    } for service in services]
    
    return jsonify({'legal_services': services_data}), 200

@admin_bp.route('/legal-services', methods=['POST'])
@admin_required
def create_legal_service():
    """Create new legal service"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('description'):
        return jsonify({'error': 'Name and description are required'}), 400
    
    try:
        service = LegalService(
            name=data.get('name'),
            description=data.get('description'),
            icon=data.get('icon', ''),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(service)
        
        # Log activity
        activity = ActivityLog(
            user_id=current_user_id,
            action='create',
            description=f'Created legal service: {service.name}',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string
        )
        db.session.add(activity)
        
        db.session.commit()
        
        return jsonify({
            'success': 'Legal service created successfully',
            'service': {
                'id': service.id,
                'name': service.name,
                'description': service.description,
                'icon': service.icon,
                'is_active': service.is_active
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create legal service: {str(e)}'}), 400

@admin_bp.route('/legal-services/<int:service_id>', methods=['PUT'])
@admin_required
def edit_legal_service(service_id):
    """Update legal service"""
    current_user_id = get_jwt_identity()
    service = LegalService.query.get(service_id)
    
    if not service:
        return jsonify({'error': 'Legal service not found'}), 404
    
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request data is required'}), 400
    
    try:
        service.name = data.get('name', service.name)
        service.description = data.get('description', service.description)
        service.icon = data.get('icon', service.icon)
        service.is_active = data.get('is_active', service.is_active)
        
        # Log activity
        activity = ActivityLog(
            user_id=current_user_id,
            action='update',
            description=f'Updated legal service: {service.name}',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string
        )
        db.session.add(activity)
        
        db.session.commit()
        
        return jsonify({
            'success': 'Legal service updated successfully',
            'service': {
                'id': service.id,
                'name': service.name,
                'description': service.description,
                'icon': service.icon,
                'is_active': service.is_active
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update legal service: {str(e)}'}), 400

@admin_bp.route('/activity-logs', methods=['GET'])
@admin_required
def activity_logs():
    """Get activity logs with filtering and pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 25, type=int)
    action_filter = request.args.get('action')
    user_filter = request.args.get('user_id', type=int)
    
    query = ActivityLog.query.join(User)
    
    if action_filter:
        query = query.filter(ActivityLog.action == action_filter)
    
    if user_filter:
        query = query.filter(ActivityLog.user_id == user_filter)
    
    logs_pagination = query.order_by(desc(ActivityLog.created_at)).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Get all users for filter dropdown
    users = User.query.all()
    
    logs_data = [{
        'id': log.id,
        'user': {
            'id': log.user.id,
            'name': log.user.get_full_name(),
            'user_type': log.user.user_type
        },
        'action': log.action,
        'description': log.description,
        'ip_address': log.ip_address,
        'user_agent': log.user_agent,
        'created_at': log.created_at.isoformat()
    } for log in logs_pagination.items]
    
    return jsonify({
        'logs': logs_data,
        'pagination': {
            'page': logs_pagination.page,
            'pages': logs_pagination.pages,
            'per_page': logs_pagination.per_page,
            'total': logs_pagination.total,
            'has_prev': logs_pagination.has_prev,
            'has_next': logs_pagination.has_next,
            'prev_num': logs_pagination.prev_num,
            'next_num': logs_pagination.next_num
        },
        'filters': {
            'current_action': action_filter,
            'current_user': user_filter
        },
        'users': [{
            'id': user.id,
            'name': user.get_full_name(),
            'user_type': user.user_type
        } for user in users]
    }), 200

@admin_bp.route('/reports', methods=['GET'])
@admin_required
def reports():
    """Generate system reports with date filtering"""
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    # Default to last 30 days if no dates provided
    if not date_from:
        date_from = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')
    if not date_to:
        date_to = datetime.utcnow().strftime('%Y-%m-%d')
    
    try:
        start_date = datetime.strptime(date_from, '%Y-%m-%d')
        end_date = datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # Generate report data
    report_data = {
        'period': {
            'from': date_from,
            'to': date_to
        },
        'user_metrics': {
            'new_users': User.query.filter(
                User.created_at >= start_date,
                User.created_at < end_date
            ).count(),
            'new_clients': User.query.filter(
                User.created_at >= start_date,
                User.created_at < end_date,
                User.user_type == 'client'
            ).count(),
            'new_lawyers': User.query.filter(
                User.created_at >= start_date,
                User.created_at < end_date,
                User.user_type == 'lawyer'
            ).count(),
            'approved_lawyers': User.query.filter(
                User.created_at >= start_date,
                User.created_at < end_date,
                User.user_type == 'lawyer',
                User.approval_status == 'approved'
            ).count()
        },
        'case_metrics': {
            'new_cases': Case.query.filter(
                Case.created_at >= start_date,
                Case.created_at < end_date
            ).count(),
            'resolved_cases': Case.query.filter(
                Case.resolved_at >= start_date,
                Case.resolved_at < end_date
            ).count() if Case.query.filter(Case.resolved_at.isnot(None)).first() else 0
        },
        'financial_metrics': {
            'completed_transactions': Transaction.query.filter(
                Transaction.created_at >= start_date,
                Transaction.created_at < end_date,
                Transaction.status == 'completed'
            ).count(),
            'total_revenue': float(db.session.query(func.sum(Transaction.amount)).filter(
                Transaction.created_at >= start_date,
                Transaction.created_at < end_date,
                Transaction.status == 'completed'
            ).scalar() or 0),
            'invoices_generated': Invoice.query.filter(
                Invoice.issue_date >= start_date.date(),
                Invoice.issue_date < end_date.date()
            ).count(),
            'invoices_paid': Invoice.query.filter(
                Invoice.paid_date >= start_date.date(),
                Invoice.paid_date < end_date.date()
            ).count() if Invoice.query.filter(Invoice.paid_date.isnot(None)).first() else 0
        }
    }
    
    return jsonify(report_data), 200

@admin_bp.route('/users/<int:user_id>/toggle-active', methods=['POST'])
@admin_required
def toggle_user_active_status(user_id):
    """Toggle user active status"""
    current_user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        user.is_active = not user.is_active
        status = 'activated' if user.is_active else 'deactivated'
        
        # Create notification for user
        notification = Notification(
            recipient_id=user.id,
            notification_type='account_status_changed',
            title=f'Account {status.title()}',
            message=f'Your account has been {status} by an administrator.'
        )
        db.session.add(notification)
        
        # Log activity
        activity = ActivityLog(
            user_id=current_user_id,
            action='update',
            description=f'{status.title()} user account: {user.get_full_name()}',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string
        )
        db.session.add(activity)
        
        db.session.commit()
        
        return jsonify({
            'success': f'User {status} successfully',
            'user_id': user_id,
            'is_active': user.is_active
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update user status: {str(e)}'}), 400

@admin_bp.route('/chat-activities', methods=['GET'])
@admin_required
def get_chat_activities():
    """Get recent chat activities for admin dashboard"""
    try:
        # Get all cases with their chats
        cases = Case.query.order_by(db.desc(Case.updated_at)).limit(50).all()
        
        chat_activities = []
        
        for case in cases:
            # Get the most recent chat message for this case
            recent_chat = Chat.query.filter_by(case_id=case.id)\
                .order_by(db.desc(Chat.created_at)).first()
            
            if recent_chat:
                # Get message count
                message_count = Chat.query.filter_by(case_id=case.id).count()
                
                # Get unread count (messages not read by the other party)
                unread_count = Chat.query.filter(
                    Chat.case_id == case.id,
                    Chat.is_read == False,
                    Chat.sender_id != recent_chat.sender_id  # Messages from the other party
                ).count()
                
                chat_activities.append({
                    'id': f"{case.id}-{recent_chat.id}",
                    'case_id': case.id,
                    'case_title': case.title,
                    'case_number': case.case_number,
                    'client_id': case.client_id,
                    'client_name': case.client.get_full_name(),
                    'lawyer_id': case.lawyer_id,
                    'lawyer_name': case.lawyer.get_full_name() if case.lawyer else 'Unassigned',
                    'last_message': recent_chat.message,
                    'last_message_type': 'Client' if recent_chat.sender_id == case.client_id else 'Lawyer',
                    'sender_name': recent_chat.sender.get_full_name(),
                    'last_activity': recent_chat.created_at.isoformat(),
                    'message_count': message_count,
                    'has_unread': unread_count > 0,
                    'unread_count': unread_count,
                    'case_status': case.status
                })
            else:
                # Include cases even if they have no chats yet
                chat_activities.append({
                    'id': f"case-{case.id}",
                    'case_id': case.id,
                    'case_title': case.title,
                    'case_number': case.case_number,
                    'client_id': case.client_id,
                    'client_name': case.client.get_full_name(),
                    'lawyer_id': case.lawyer_id,
                    'lawyer_name': case.lawyer.get_full_name() if case.lawyer else 'Unassigned',
                    'last_message': 'No messages yet',
                    'last_message_type': 'None',
                    'sender_name': 'System',
                    'last_activity': case.created_at.isoformat(),
                    'message_count': 0,
                    'has_unread': False,
                    'unread_count': 0,
                    'case_status': case.status
                })
        
        # Sort by most recent activity
        chat_activities.sort(key=lambda x: x['last_activity'], reverse=True)
        
        return jsonify(chat_activities[:20])  # Return top 20 most recent
        
    except Exception as e:
        current_app.logger.error(f"Error getting chat activities: {str(e)}")
        return jsonify({'error': 'Failed to fetch chat activities'}), 500

@admin_bp.route('/all-chats', methods=['GET'])
@admin_required
def get_all_chats():
    """Get all chats for admin monitoring"""
    try:
        # Get recent chats across all cases
        recent_chats = Chat.query.order_by(db.desc(Chat.created_at)).limit(100).all()
        
        chats_data = []
        for chat in recent_chats:
            case = Case.query.get(chat.case_id)
            if case:
                chats_data.append({
                    'id': chat.id,
                    'case_id': case.id,
                    'case_title': case.title,
                    'case_number': case.case_number,
                    'sender_id': chat.sender_id,
                    'sender_name': chat.sender.get_full_name(),
                    'sender_type': chat.sender.user_type,
                    'message': chat.message,
                    'attachment': chat.attachment,
                    'is_read': chat.is_read,
                    'created_at': chat.created_at.isoformat(),
                    'client_name': case.client.get_full_name(),
                    'lawyer_name': case.lawyer.get_full_name() if case.lawyer else 'Unassigned'
                })
        
        return jsonify(chats_data)
        
    except Exception as e:
        current_app.logger.error(f"Error getting all chats: {str(e)}")
        return jsonify({'error': 'Failed to fetch chats'}), 500

# Legacy API endpoints (kept for backwards compatibility)
@admin_bp.route('/api/dashboard-stats', methods=['GET'])
@admin_required
def api_dashboard_stats():
    """API endpoint for dashboard statistics (legacy)"""
    stats = {
        'totalLawyers': User.query.filter_by(user_type='lawyer').count(),
        'totalClients': User.query.filter_by(user_type='client').count(),
        'activeCases': Case.query.filter(Case.status.in_(['open', 'assigned', 'in_progress'])).count(),
        'pendingApprovals': User.query.filter_by(user_type='lawyer', approval_status='pending').count(),
        'unassignedCases': Case.query.filter_by(status='open').count(),
        'revenue': float(db.session.query(func.sum(Transaction.amount)).filter(Transaction.status == 'completed').scalar() or 0),
        'totalCases': Case.query.count(),
        'pendingInvoices': Invoice.query.filter_by(status='sent').count()
    }
    return jsonify(stats), 200