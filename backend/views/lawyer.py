from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from models import (db, Case, LegalService, LawyerRequest, Notification, 
                   Transaction, Invoice, Document, ChatMessage)
from datetime import datetime, date, timedelta
from decimal import Decimal
from functools import wraps

lawyer_bp = Blueprint('lawyer', __name__)

from functools import wraps
def lawyer_required(f):
    """Decorator to ensure only approved lawyers can access these routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.user_type != 'lawyer':
            flash('Access denied. Lawyer account required.', 'error')
            return redirect(url_for('main.home'))
        if current_user.lawyer_profile.approval_status != 'approved':
            return redirect(url_for('lawyer.pending_approval'))
        return f(*args, **kwargs)
    return decorated_function

@lawyer_bp.route('/pending-approval')
@login_required
def pending_approval():
    """Pending approval page for lawyers"""
    if current_user.user_type != 'lawyer':
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    
    if current_user.lawyer_profile.approval_status == 'approved':
        return redirect(url_for('lawyer.dashboard'))
    
    return render_template('lawyer/pending_approval.html', 
                         status=current_user.lawyer_profile.approval_status,
                         rejection_reason=current_user.lawyer_profile.rejection_reason)

@lawyer_bp.route('/dashboard')
@login_required
@lawyer_required
def dashboard():
    """Lawyer dashboard"""
    # Get lawyer statistics
    total_cases = Case.query.filter_by(lawyer_id=current_user.id).count()
    active_cases = Case.query.filter_by(
        lawyer_id=current_user.id
    ).filter(Case.status.in_(['assigned', 'in_progress'])).count()
    
    resolved_cases = Case.query.filter_by(
        lawyer_id=current_user.id, 
        status='resolved'
    ).count()
    
    # Get available cases based on specializations
    specialization_ids = [spec.id for spec in current_user.lawyer_profile.specializations]
    available_cases = Case.query.filter(
        Case.status == 'open',
        Case.legal_service_id.in_(specialization_ids)
    ).order_by(Case.created_at.desc()).limit(10).all()
    
    # Get recent cases
    recent_cases = Case.query.filter_by(
        lawyer_id=current_user.id
    ).order_by(Case.created_at.desc()).limit(5).all()
    
    # Get recent notifications
    recent_notifications = Notification.query.filter_by(
        recipient_id=current_user.id
    ).order_by(Notification.created_at.desc()).limit(5).all()
    
    # Get pending requests sent by this lawyer
    pending_requests = LawyerRequest.query.filter_by(
        lawyer_id=current_user.id,
        status='pending'
    ).count()
    
    # Get total earnings
    total_earnings = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.lawyer_id == current_user.id,
        Transaction.status == 'completed'
    ).scalar() or 0
    
    return render_template('lawyer/dashboard.html',
                         total_cases=total_cases,
                         active_cases=active_cases,
                         resolved_cases=resolved_cases,
                         available_cases=available_cases,
                         recent_cases=recent_cases,
                         recent_notifications=recent_notifications,
                         pending_requests=pending_requests,
                         total_earnings=total_earnings)

@lawyer_bp.route('/profile')
@login_required
@lawyer_required
def profile():
    """Lawyer profile page"""
    services = LegalService.query.filter_by(is_active=True).all()
    return render_template('lawyer/profile.html', services=services)

@lawyer_bp.route('/profile', methods=['POST'])
@login_required
@lawyer_required
def update_profile():
    """Update lawyer profile"""
    try:
        data = request.get_json()
        # Update user information
        current_user.first_name = data.get('first_name')
        current_user.last_name = data.get('last_name')
        current_user.email = data.get('email')
        current_user.phone = data.get('phone')
        current_user.address = data.get('address')

        # Update lawyer profile
        profile = current_user.lawyer_profile
        profile.years_of_experience = int(data.get('years_of_experience')) if data.get('years_of_experience') else None
        profile.education = data.get('education')
        profile.bar_association = data.get('bar_association')
        profile.hourly_rate = Decimal(data.get('hourly_rate')) if data.get('hourly_rate') else None
        profile.bio = data.get('bio')
        profile.certifications = data.get('certifications')

        # Update specializations (many-to-many)
        specializations = data.get('specializations', [])
        if isinstance(specializations, list):
            services = LegalService.query.filter(LegalService.id.in_(specializations)).all()
            profile.specializations = services
        
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash('Error updating profile. Please try again.', 'error')
    
    return redirect(url_for('lawyer.profile'))

@lawyer_bp.route('/cases')
@login_required
@lawyer_required
def cases():
    """Lawyer cases page"""
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    
    query = Case.query.filter_by(lawyer_id=current_user.id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    cases = query.order_by(Case.created_at.desc()).paginate(
        page=page, per_page=10, error_out=False
    )
    
    return render_template('lawyer/cases.html', 
                         cases=cases,
                         current_status=status_filter)

@lawyer_bp.route('/cases/<case_id>')
@login_required
@lawyer_required
def case_detail(case_id):
    """View case details"""
    case = Case.query.filter_by(id=case_id, lawyer_id=current_user.id).first_or_404()
    
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
    
    return render_template('lawyer/case_detail.html',
                         case=case,
                         documents=documents,
                         transactions=transactions,
                         invoices=invoices)

@lawyer_bp.route('/available-cases')
@login_required
@lawyer_required
def available_cases():
    """View available cases for lawyer's specializations"""
    page = request.args.get('page', 1, type=int)
    service_filter = request.args.get('service')
    priority_filter = request.args.get('priority')
    
    # Get lawyer's specializations
    specialization_ids = [spec.id for spec in current_user.lawyer_profile.specializations]
    
    query = Case.query.filter(
        Case.status == 'open',
        Case.legal_service_id.in_(specialization_ids)
    )
    
    if service_filter:
        query = query.filter_by(legal_service_id=service_filter)
    
    if priority_filter:
        query = query.filter_by(priority=priority_filter)
    
    cases = query.order_by(Case.created_at.desc()).paginate(
        page=page, per_page=10, error_out=False
    )
    
    # Get lawyer's requests for display
    lawyer_request_case_ids = [req.case_id for req in LawyerRequest.query.filter_by(
        lawyer_id=current_user.id
    ).all()]
    
    services = current_user.lawyer_profile.specializations
    
    return render_template('lawyer/available_cases.html', 
                         cases=cases,
                         services=services,
                         lawyer_request_case_ids=lawyer_request_case_ids,
                         current_service=service_filter,
                         current_priority=priority_filter)

@lawyer_bp.route('/cases/<case_id>/request', methods=['POST'])
@login_required
@lawyer_required
def request_case(case_id):
    """Request to handle a case"""
    case = Case.query.get_or_404(case_id)
    
    # Check if case is still open
    if case.status != 'open':
        flash('This case is no longer available.', 'error')
        return redirect(url_for('lawyer.available_cases'))
    
    # Check if lawyer already requested this case
    existing_request = LawyerRequest.query.filter_by(
        case_id=case_id,
        lawyer_id=current_user.id
    ).first()
    
    if existing_request:
        flash('You have already requested this case.', 'warning')
        return redirect(url_for('lawyer.available_cases'))
    
    # Check if lawyer specializes in this service
    if case.legal_service not in current_user.lawyer_profile.specializations:
        flash('You are not specialized in this service area.', 'error')
        return redirect(url_for('lawyer.available_cases'))
    
    try:
        # Create lawyer request
        lawyer_request = LawyerRequest(
            case_id=case_id,
            lawyer_id=current_user.id,
            message=request.get_json().get('message'),
            proposed_fee=Decimal(request.get_json().get('proposed_fee')) if request.get_json().get('proposed_fee') else None
        )
        db.session.add(lawyer_request)
        
        # Create notification for client
        notification = Notification(
            recipient_id=case.client_id,
            notification_type='case_request',
            title='New Case Request',
            message=f'Lawyer {current_user.get_full_name()} has requested to handle your case "{case.title}"',
            related_case_id=case_id
        )
        db.session.add(notification)
        
        db.session.commit()
        flash('Case request sent successfully!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash('Error sending request. Please try again.', 'error')
    
    return redirect(url_for('lawyer.available_cases'))

@lawyer_bp.route('/my-requests')
@login_required
@lawyer_required
def my_requests():
    """View lawyer's case requests"""
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    
    query = LawyerRequest.query.filter_by(lawyer_id=current_user.id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    requests = query.order_by(LawyerRequest.created_at.desc()).paginate(
        page=page, per_page=10, error_out=False
    )
    
    return render_template('lawyer/my_requests.html', 
                         requests=requests,
                         current_status=status_filter)

@lawyer_bp.route('/cases/<case_id>/update-status', methods=['POST'])
@login_required
@lawyer_required
def update_case_status(case_id):
    """Update case status"""
    case = Case.query.filter_by(id=case_id, lawyer_id=current_user.id).first_or_404()
    
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['assigned', 'in_progress', 'resolved']:
        flash('Invalid status.', 'error')
        return redirect(url_for('lawyer.case_detail', case_id=case_id))
    
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
        flash('Case status updated successfully!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash('Error updating case status. Please try again.', 'error')
    
    return redirect(url_for('lawyer.case_detail', case_id=case_id))

@lawyer_bp.route('/invoices')
@login_required
@lawyer_required
def invoices():
    """View lawyer invoices"""
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    
    query = Invoice.query.filter_by(lawyer_id=current_user.id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    invoices = query.order_by(Invoice.issue_date.desc()).paginate(
        page=page, per_page=15, error_out=False
    )
    
    return render_template('lawyer/invoices.html', 
                         invoices=invoices,
                         current_status=status_filter)

@lawyer_bp.route('/invoices/create/<case_id>')
@login_required
@lawyer_required
def create_invoice(case_id):
    """Create invoice form"""
    case = Case.query.filter_by(id=case_id, lawyer_id=current_user.id).first_or_404()
    return render_template('lawyer/create_invoice.html', case=case)

@lawyer_bp.route('/invoices/create/<case_id>', methods=['POST'])
@login_required
@lawyer_required
def create_invoice_post(case_id):
    """Handle invoice creation"""
    case = Case.query.filter_by(id=case_id, lawyer_id=current_user.id).first_or_404()
    
    try:
        amount = Decimal(request.form.get('amount'))
        tax_amount = Decimal(request.form.get('tax_amount', '0'))
        due_days = int(request.form.get('due_days', '30'))
        due_date = date.today() + timedelta(days=due_days)
        
        invoice = Invoice(
            case_id=case_id,
            client_id=case.client_id,
            lawyer_id=current_user.id,
            amount=amount,
            tax_amount=tax_amount,
            total_amount=amount + tax_amount,
            description=request.form.get('description'),
            due_date=due_date,
            status='draft'
        )
        
        db.session.add(invoice)
        db.session.commit()
        
        flash('Invoice created successfully!', 'success')
        return redirect(url_for('lawyer.invoice_detail', invoice_id=invoice.id))
        
    except Exception as e:
        db.session.rollback()
        flash('Error creating invoice. Please try again.', 'error')
        return redirect(url_for('lawyer.create_invoice', case_id=case_id))

@lawyer_bp.route('/invoices/<invoice_id>')
@login_required
@lawyer_required
def invoice_detail(invoice_id):
    """View invoice details"""
    invoice = Invoice.query.filter_by(id=invoice_id, lawyer_id=current_user.id).first_or_404()
    return render_template('lawyer/invoice_detail.html', invoice=invoice)

@lawyer_bp.route('/invoices/<invoice_id>/send', methods=['POST'])
@login_required
@lawyer_required
def send_invoice(invoice_id):
    """Send invoice to client"""
    invoice = Invoice.query.filter_by(id=invoice_id, lawyer_id=current_user.id).first_or_404()
    
    if invoice.status != 'draft':
        flash('Invoice cannot be sent.', 'error')
        return redirect(url_for('lawyer.invoice_detail', invoice_id=invoice_id))
    
    try:
        invoice.status = 'sent'
        
        # Create notification for client
        notification = Notification(
            recipient_id=invoice.client_id,
            notification_type='invoice_generated',
            title='New Invoice',
            message=f'You have received an invoice for ${invoice.total_amount} for case "{invoice.case.title}"',
            related_case_id=invoice.case_id
        )
        db.session.add(notification)
        
        db.session.commit()
        flash('Invoice sent to client successfully!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash('Error sending invoice. Please try again.', 'error')
    
    return redirect(url_for('lawyer.invoice_detail', invoice_id=invoice_id))

@lawyer_bp.route('/transactions')
@login_required
@lawyer_required
def transactions():
    """View lawyer transactions"""
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    
    query = Transaction.query.filter_by(lawyer_id=current_user.id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    transactions = query.order_by(Transaction.created_at.desc()).paginate(
        page=page, per_page=15, error_out=False
    )
    
    return render_template('lawyer/transactions.html', 
                         transactions=transactions,
                         current_status=status_filter)

@lawyer_bp.route('/documents')
@login_required
@lawyer_required
def documents():
    """View lawyer documents"""
    page = request.args.get('page', 1, type=int)
    case_filter = request.args.get('case')
    doc_type_filter = request.args.get('type')
    
    query = Document.query.join(Case).filter(Case.lawyer_id == current_user.id)
    
    if case_filter:
        query = query.filter(Document.case_id == case_filter)
    
    if doc_type_filter:
        query = query.filter(Document.document_type == doc_type_filter)
    
    documents = query.order_by(Document.created_at.desc()).paginate(
        page=page, per_page=15, error_out=False
    )
    
    # Get lawyer's cases for filter
    lawyer_cases = Case.query.filter_by(lawyer_id=current_user.id).all()
    
    return render_template('lawyer/documents.html', 
                         documents=documents,
                         cases=lawyer_cases,
                         current_case=case_filter,
                         current_type=doc_type_filter)

@lawyer_bp.route('/notifications')
@login_required
@lawyer_required
def notifications():
    """View lawyer notifications"""
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
    
    return render_template('lawyer/notifications.html', notifications=notifications)

@lawyer_bp.route('/api/stats')
@login_required
@lawyer_required
def api_stats():
    """API endpoint for lawyer statistics"""
    stats = {
        'total_cases': Case.query.filter_by(lawyer_id=current_user.id).count(),
        'active_cases': Case.query.filter_by(lawyer_id=current_user.id).filter(
            Case.status.in_(['assigned', 'in_progress'])
        ).count(),
        'resolved_cases': Case.query.filter_by(lawyer_id=current_user.id, status='resolved').count(),
        'total_earnings': float(db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.lawyer_id == current_user.id,
            Transaction.status == 'completed'
        ).scalar() or 0),
        'pending_requests': LawyerRequest.query.filter_by(
            lawyer_id=current_user.id,
            status='pending'
        ).count(),
        'unread_notifications': Notification.query.filter_by(
            recipient_id=current_user.id,
            is_read=False
        ).count(),
        'available_cases': Case.query.filter(
            Case.status == 'open',
            Case.legal_service_id.in_([spec.id for spec in current_user.lawyer_profile.specializations])
        ).count()
    }
    
    return jsonify(stats)