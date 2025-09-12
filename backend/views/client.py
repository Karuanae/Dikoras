from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from flask_jwt_extended import jwt_required, get_jwt_identity

client_bp = Blueprint('client', __name__)

@client_bp.route('/api/client/cases', methods=['GET'])
@jwt_required()
def api_client_cases():
    """API endpoint: Get all cases for authenticated client (JWT)"""
    user_id = get_jwt_identity()
    cases = Case.query.filter_by(client_id=user_id).order_by(Case.created_at.desc()).all()
    cases_data = [
        {
            'id': c.id,
            'title': c.title,
            'status': c.status,
            'created_at': c.created_at.isoformat(),
            'service': c.legal_service.name if c.legal_service else None
        }
        for c in cases
    ]
    return jsonify({'cases': cases_data}), 200
from models import (db, Case, LegalService, LawyerRequest, Notification, 
                   Transaction, Invoice, Document, ChatMessage)
from datetime import datetime
from werkzeug.utils import secure_filename
import os

client_bp = Blueprint('client', __name__)

import functools
def client_required(f):
    """Decorator to ensure only clients can access these routes"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.user_type != 'client':
            flash('Access denied. Client account required.', 'error')
            return redirect(url_for('main.home'))
        return f(*args, **kwargs)
    return decorated_function

@client_bp.route('/dashboard')
@login_required
@client_required
def dashboard():
    """Client dashboard"""
    # Get client statistics
    total_cases = Case.query.filter_by(client_id=current_user.id).count()
    active_cases = Case.query.filter_by(
        client_id=current_user.id
    ).filter(Case.status.in_(['open', 'assigned', 'in_progress'])).count()
    
    resolved_cases = Case.query.filter_by(
        client_id=current_user.id, 
        status='resolved'
    ).count()
    
    # Get recent cases
    recent_cases = Case.query.filter_by(
        client_id=current_user.id
    ).order_by(Case.created_at.desc()).limit(5).all()
    
    # Get recent notifications
    recent_notifications = Notification.query.filter_by(
        recipient_id=current_user.id
    ).order_by(Notification.created_at.desc()).limit(5).all()
    
    # Get pending lawyer requests
    pending_requests = LawyerRequest.query.join(Case).filter(
        Case.client_id == current_user.id,
        LawyerRequest.status == 'pending'
    ).count()
    
    # Get total spent
    total_spent = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.client_id == current_user.id,
        Transaction.status == 'completed'
    ).scalar() or 0
    
    return render_template('client/dashboard.html',
                         total_cases=total_cases,
                         active_cases=active_cases,
                         resolved_cases=resolved_cases,
                         recent_cases=recent_cases,
                         recent_notifications=recent_notifications,
                         pending_requests=pending_requests,
                         total_spent=total_spent)

@client_bp.route('/profile')
@login_required
@client_required
def profile():
    """Client profile page"""
    services = LegalService.query.filter_by(is_active=True).all()
    return render_template('client/profile.html', services=services)

@client_bp.route('/profile', methods=['POST'])
@login_required
@client_required
def update_profile():
    """Update client profile"""
    try:
        data = request.get_json()
        # Update user information
        current_user.first_name = data.get('first_name')
        current_user.last_name = data.get('last_name')
        current_user.email = data.get('email')
        current_user.phone = data.get('phone')
        current_user.address = data.get('address')

        # Update client profile
        if current_user.client_profile:
            current_user.client_profile.company_name = data.get('company_name')
            current_user.client_profile.national_id = data.get('national_id')

            # Update preferred services
            preferred_services = data.get('preferred_services', [])
            if preferred_services:
                services = LegalService.query.filter(LegalService.id.in_(preferred_services)).all()
                current_user.client_profile.preferred_services = services

        db.session.commit()
        return jsonify({'message': 'Profile updated successfully!'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error updating profile. Please try again.'}), 400

@client_bp.route('/cases')
@login_required
@client_required
def cases():
    """Client cases page"""
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    service_filter = request.args.get('service')
    
    query = Case.query.filter_by(client_id=current_user.id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    if service_filter:
        query = query.filter_by(legal_service_id=service_filter)
    
    cases = query.order_by(Case.created_at.desc()).paginate(
        page=page, per_page=10, error_out=False
    )
    
    services = LegalService.query.filter_by(is_active=True).all()
    
    return render_template('client/cases.html', 
                         cases=cases, 
                         services=services,
                         current_status=status_filter,
                         current_service=service_filter)

@client_bp.route('/cases/<case_id>')
@login_required
@client_required
def case_detail(case_id):
    """View case details"""
    case = Case.query.filter_by(id=case_id, client_id=current_user.id).first_or_404()
    
    # Get lawyer requests for this case
    lawyer_requests = LawyerRequest.query.filter_by(case_id=case_id).order_by(
        LawyerRequest.created_at.desc()
    ).all()
    
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
    
    return render_template('client/case_detail.html',
                         case=case,
                         lawyer_requests=lawyer_requests,
                         documents=documents,
                         transactions=transactions,
                         invoices=invoices)

@client_bp.route('/cases/create')
@login_required
@client_required
def create_case():
    """Create new case form"""
    service_id = request.args.get('service_id')
    services = LegalService.query.filter_by(is_active=True).all()
    selected_service = None
    
    if service_id:
        selected_service = LegalService.query.get(service_id)
    
    return render_template('client/create_case.html', 
                         services=services, 
                         selected_service=selected_service)

@client_bp.route('/cases/create', methods=['POST'])
@login_required
@client_required
def create_case_post():
    """Handle case creation"""
    try:
        data = request.get_json()
        case = Case(
            client_id=current_user.id,
            legal_service_id=data.get('legal_service_id'),
            title=data.get('title'),
            description=data.get('description'),
            priority=data.get('priority', 'medium'),
            budget=float(data.get('budget')) if data.get('budget') else None,
            deadline=datetime.strptime(data.get('deadline'), '%Y-%m-%d') if data.get('deadline') else None
        )

        db.session.add(case)
        db.session.commit()

        # Create notification for admin
        notification = Notification(
            recipient_id=get_admin_user_id(),
            notification_type='case_status_update',
            title='New Case Created',
            message=f'A new case "{case.title}" has been created by {current_user.get_full_name()}',
            related_case_id=case.id
        )
        db.session.add(notification)
        db.session.commit()

        return jsonify({'message': 'Case created successfully!', 'case_id': case.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error creating case. Please try again.'}), 400
        
    except Exception as e:
        db.session.rollback()
        flash('Error creating case. Please try again.', 'error')
        return redirect(url_for('client.create_case'))

@client_bp.route('/lawyer-requests')
@login_required
@client_required
def lawyer_requests():
    """View pending lawyer requests"""
    page = request.args.get('page', 1, type=int)
    
    requests = LawyerRequest.query.join(Case).filter(
        Case.client_id == current_user.id,
        LawyerRequest.status == 'pending'
    ).order_by(LawyerRequest.created_at.desc()).paginate(
        page=page, per_page=10, error_out=False
    )
    
    return render_template('client/lawyer_requests.html', requests=requests)

@client_bp.route('/lawyer-requests/<request_id>/accept', methods=['POST'])
@login_required
@client_required
def accept_lawyer_request(request_id):
    """Accept a lawyer request"""
    lawyer_request = LawyerRequest.query.get_or_404(request_id)
    
    # Verify this request belongs to client's case
    if lawyer_request.case.client_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('client.lawyer_requests'))
    
    try:
        # Accept the request
        lawyer_request.status = 'accepted'
        lawyer_request.responded_at = datetime.utcnow()
        
        # Assign lawyer to case
        case = lawyer_request.case
        case.lawyer_id = lawyer_request.lawyer_id
        case.status = 'assigned'
        case.assigned_at = datetime.utcnow()
        
        # Reject all other pending requests for this case
        other_requests = LawyerRequest.query.filter(
            LawyerRequest.case_id == case.id,
            LawyerRequest.id != request_id,
            LawyerRequest.status == 'pending'
        ).all()
        
        for req in other_requests:
            req.status = 'rejected'
            req.responded_at = datetime.utcnow()
        
        # Create notifications
        # Notify accepted lawyer
        notification = Notification(
            recipient_id=lawyer_request.lawyer_id,
            notification_type='case_accepted',
            title='Case Request Accepted',
            message=f'Your request for case "{case.title}" has been accepted by {current_user.get_full_name()}',
            related_case_id=case.id
        )
        db.session.add(notification)
        
        # Notify rejected lawyers
        for req in other_requests:
            notification = Notification(
                recipient_id=req.lawyer_id,
                notification_type='case_rejected',
                title='Case Request Rejected',
                message=f'Your request for case "{case.title}" was not selected',
                related_case_id=case.id
            )
            db.session.add(notification)
        
        db.session.commit()
        flash('Lawyer request accepted successfully!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash('Error accepting request. Please try again.', 'error')
    
    return redirect(url_for('client.case_detail', case_id=lawyer_request.case_id))

@client_bp.route('/lawyer-requests/<request_id>/reject', methods=['POST'])
@login_required
@client_required
def reject_lawyer_request(request_id):
    """Reject a lawyer request"""
    lawyer_request = LawyerRequest.query.get_or_404(request_id)
    
    # Verify this request belongs to client's case
    if lawyer_request.case.client_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('client.lawyer_requests'))
    
    try:
        lawyer_request.status = 'rejected'
        lawyer_request.responded_at = datetime.utcnow()
        
        # Create notification for rejected lawyer
        notification = Notification(
            recipient_id=lawyer_request.lawyer_id,
            notification_type='case_rejected',
            title='Case Request Rejected',
            message=f'Your request for case "{lawyer_request.case.title}" has been rejected',
            related_case_id=lawyer_request.case_id
        )
        db.session.add(notification)
        
        db.session.commit()
        flash('Lawyer request rejected.', 'info')
        
    except Exception as e:
        db.session.rollback()
        flash('Error rejecting request. Please try again.', 'error')
    
    return redirect(url_for('client.case_detail', case_id=lawyer_request.case_id))

@client_bp.route('/transactions')
@login_required
@client_required
def transactions():
    """View client transactions"""
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    
    query = Transaction.query.filter_by(client_id=current_user.id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    transactions = query.order_by(Transaction.created_at.desc()).paginate(
        page=page, per_page=15, error_out=False
    )
    
    return render_template('client/transactions.html', 
                         transactions=transactions,
                         current_status=status_filter)

@client_bp.route('/invoices')
@login_required
@client_required
def invoices():
    """View client invoices"""
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    
    query = Invoice.query.filter_by(client_id=current_user.id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    invoices = query.order_by(Invoice.issue_date.desc()).paginate(
        page=page, per_page=15, error_out=False
    )
    
    return render_template('client/invoices.html', 
                         invoices=invoices,
                         current_status=status_filter)

@client_bp.route('/invoices/<invoice_id>')
@login_required
@client_required
def invoice_detail(invoice_id):
    """View invoice details"""
    invoice = Invoice.query.filter_by(id=invoice_id, client_id=current_user.id).first_or_404()
    return render_template('client/invoice_detail.html', invoice=invoice)

@client_bp.route('/invoices/<invoice_id>/pay', methods=['POST'])
@login_required
@client_required
def pay_invoice(invoice_id):
    """Process invoice payment"""
    invoice = Invoice.query.filter_by(id=invoice_id, client_id=current_user.id).first_or_404()
    
    if invoice.status != 'sent':
        flash('This invoice cannot be paid.', 'error')
        return redirect(url_for('client.invoice_detail', invoice_id=invoice_id))
    
    try:
        # Create transaction
        transaction = Transaction(
            case_id=invoice.case_id,
            client_id=current_user.id,
            lawyer_id=invoice.lawyer_id,
            transaction_type='payment',
            amount=invoice.total_amount,
            status='completed',  # In real app, this would be 'pending' until payment gateway confirms
            description=f'Payment for invoice {invoice.invoice_number}',
            payment_method=request.get_json().get('payment_method'),
            completed_at=datetime.utcnow()
        )
        db.session.add(transaction)
        
        # Update invoice
        invoice.status = 'paid'
        invoice.paid_date = datetime.utcnow().date()
        invoice.transaction_id = transaction.id
        
        # Create notifications
        notification_client = Notification(
            recipient_id=current_user.id,
            notification_type='payment_received',
            title='Payment Processed',
            message=f'Payment of ${invoice.total_amount} for invoice {invoice.invoice_number} has been processed',
            related_case_id=invoice.case_id
        )
        db.session.add(notification_client)
        
        notification_lawyer = Notification(
            recipient_id=invoice.lawyer_id,
            notification_type='payment_received',
            title='Payment Received',
            message=f'Payment of ${invoice.total_amount} received for invoice {invoice.invoice_number}',
            related_case_id=invoice.case_id
        )
        db.session.add(notification_lawyer)
        
        db.session.commit()
        flash('Payment processed successfully!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash('Payment processing failed. Please try again.', 'error')
    
    return redirect(url_for('client.invoice_detail', invoice_id=invoice_id))

@client_bp.route('/documents')
@login_required
@client_required
def documents():
    """View client documents"""
    page = request.args.get('page', 1, type=int)
    case_filter = request.args.get('case')
    doc_type_filter = request.args.get('type')
    
    query = Document.query.join(Case).filter(Case.client_id == current_user.id)
    
    if case_filter:
        query = query.filter(Document.case_id == case_filter)
    
    if doc_type_filter:
        query = query.filter(Document.document_type == doc_type_filter)
    
    documents = query.order_by(Document.created_at.desc()).paginate(
        page=page, per_page=15, error_out=False
    )
    
    # Get client's cases for filter
    client_cases = Case.query.filter_by(client_id=current_user.id).all()
    
    return render_template('client/documents.html', 
                         documents=documents,
                         cases=client_cases,
                         current_case=case_filter,
                         current_type=doc_type_filter)

@client_bp.route('/notifications')
@login_required
@client_required
def notifications():
    """View client notifications"""
    page = request.args.get('page', 1, type=int)
    
    notifications = Notification.query.filter_by(
        recipient_id=current_user.id
    ).order_by(Notification.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    
    # Mark notifications as read
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
    
    return render_template('client/notifications.html', notifications=notifications)

@client_bp.route('/api/stats')
@login_required
@client_required
def api_stats():
    """API endpoint for client statistics"""
    stats = {
        'total_cases': Case.query.filter_by(client_id=current_user.id).count(),
        'active_cases': Case.query.filter_by(client_id=current_user.id).filter(
            Case.status.in_(['open', 'assigned', 'in_progress'])
        ).count(),
        'resolved_cases': Case.query.filter_by(client_id=current_user.id, status='resolved').count(),
        'total_spent': float(db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.client_id == current_user.id,
            Transaction.status == 'completed'
        ).scalar() or 0),
        'pending_requests': LawyerRequest.query.join(Case).filter(
            Case.client_id == current_user.id,
            LawyerRequest.status == 'pending'
        ).count(),
        'unread_notifications': Notification.query.filter_by(
            recipient_id=current_user.id,
            is_read=False
        ).count()
    }
    
    return jsonify(stats)

# Helper function
def get_admin_user_id():
    """Get admin user ID for notifications"""
    from models import User
    admin = User.query.filter_by(user_type='admin').first()
    return admin.id if admin else None