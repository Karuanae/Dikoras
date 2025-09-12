from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from models import (db, User, LawyerProfile, Case, LegalService, Transaction, 
                   Invoice, Document, Notification, ActivityLog, SystemSettings, LawyerRequest, ChatMessage)
import functools
from datetime import datetime, timedelta
from sqlalchemy import func, desc
from functools import wraps

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    """Decorator to ensure only admins can access these routes"""
<<<<<<< HEAD
    @functools.wraps(f)
=======
    @wraps(f)
>>>>>>> 04888cfa49bffd937f2adbf6312c75c0d979b7e0
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.user_type != 'admin':
            flash('Access denied. Admin privileges required.', 'error')
            return redirect(url_for('main.home'))
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/dashboard')
@login_required
@admin_required
def dashboard():
    """Admin dashboard with overview statistics"""
    # User statistics
    total_users = User.query.count()
    total_clients = User.query.filter_by(user_type='client').count()
    total_lawyers = User.query.filter_by(user_type='lawyer').count()
    pending_lawyers = LawyerProfile.query.filter_by(approval_status='pending').count()
    approved_lawyers = LawyerProfile.query.filter_by(approval_status='approved').count()
    
    # Case statistics
    total_cases = Case.query.count()
    open_cases = Case.query.filter_by(status='open').count()
    active_cases = Case.query.filter(Case.status.in_(['assigned', 'in_progress'])).count()
    resolved_cases = Case.query.filter_by(status='resolved').count()
    
    # Financial statistics
    total_transactions = Transaction.query.count()
    completed_transactions = Transaction.query.filter_by(status='completed').count()
    total_revenue = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.status == 'completed'
    ).scalar() or 0
    
    pending_invoices = Invoice.query.filter_by(status='sent').count()
    paid_invoices = Invoice.query.filter_by(status='paid').count()
    
    # Recent activities
    recent_cases = Case.query.order_by(desc(Case.created_at)).limit(5).all()
    recent_transactions = Transaction.query.order_by(desc(Transaction.created_at)).limit(5).all()
    recent_activities = ActivityLog.query.order_by(desc(ActivityLog.created_at)).limit(10).all()
    
    # Monthly statistics for charts
    current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_cases = []
    monthly_revenue = []
    
    for i in range(6):  # Last 6 months
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
        
        monthly_cases.append({
            'month': month_start.strftime('%B'),
            'count': cases_count
        })
        
        monthly_revenue.append({
            'month': month_start.strftime('%B'),
            'amount': float(revenue)
        })
    
    return render_template('admin/dashboard.html',
                         total_users=total_users,
                         total_clients=total_clients,
                         total_lawyers=total_lawyers,
                         pending_lawyers=pending_lawyers,
                         approved_lawyers=approved_lawyers,
                         total_cases=total_cases,
                         open_cases=open_cases,
                         active_cases=active_cases,
                         resolved_cases=resolved_cases,
                         total_transactions=total_transactions,
                         completed_transactions=completed_transactions,
                         total_revenue=total_revenue,
                         pending_invoices=pending_invoices,
                         paid_invoices=paid_invoices,
                         recent_cases=recent_cases,
                         recent_transactions=recent_transactions,
                         recent_activities=recent_activities,
                         monthly_cases=monthly_cases[::-1],  # Reverse for chronological order
                         monthly_revenue=monthly_revenue[::-1])

@admin_bp.route('/lawyers')
@login_required
@admin_required
def lawyers():
    """Manage lawyers"""
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    search = request.args.get('search')
    
    query = LawyerProfile.query.join(User)
    
    if status_filter:
        query = query.filter(LawyerProfile.approval_status == status_filter)
    
    if search:
        query = query.filter(
            User.first_name.contains(search) |
            User.last_name.contains(search) |
            User.email.contains(search) |
            LawyerProfile.license_number.contains(search)
        )
    
    lawyers = query.order_by(desc(LawyerProfile.created_at)).paginate(
        page=page, per_page=15, error_out=False
    )
    
    return render_template('admin/lawyers.html', 
                         lawyers=lawyers,
                         current_status=status_filter,
                         current_search=search)

@admin_bp.route('/lawyers/<lawyer_id>')
@login_required
@admin_required
def lawyer_detail(lawyer_id):
    """View lawyer details"""
    lawyer = LawyerProfile.query.get_or_404(lawyer_id)
    
    # Get lawyer's cases
    lawyer_cases = Case.query.filter_by(lawyer_id=lawyer.user_id).order_by(
        desc(Case.created_at)
    ).limit(10).all()
    
    # Get lawyer's earnings
    total_earnings = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.lawyer_id == lawyer.user_id,
        Transaction.status == 'completed'
    ).scalar() or 0
    
    return render_template('admin/lawyer_detail.html', 
                         lawyer=lawyer,
                         cases=lawyer_cases,
                         total_earnings=total_earnings)

@admin_bp.route('/lawyers/<lawyer_id>/approve', methods=['POST'])
@login_required
@admin_required
def approve_lawyer(lawyer_id):
    """Approve lawyer registration"""
    lawyer = LawyerProfile.query.get_or_404(lawyer_id)
    
    if lawyer.approval_status != 'pending':
        flash('This lawyer has already been processed.', 'warning')
        return redirect(url_for('admin.lawyer_detail', lawyer_id=lawyer_id))
    
    try:
        lawyer.approval_status = 'approved'
        lawyer.approved_by_id = current_user.id
        lawyer.approved_at = datetime.utcnow()
        lawyer.rejection_reason = None
        
        # Create notification for lawyer
        notification = Notification(
            recipient_id=lawyer.user_id,
            notification_type='lawyer_approved',
            title='Account Approved',
            message='Congratulations! Your lawyer account has been approved and you can now access the platform.'
        )
        db.session.add(notification)
        
        # Log activity
        activity = ActivityLog(
            user_id=current_user.id,
            action='approve',
            model_name='LawyerProfile',
            object_id=lawyer_id,
            description=f'Approved lawyer registration for {lawyer.user.get_full_name()}',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string
        )
        db.session.add(activity)
        
        db.session.commit()
        flash('Lawyer approved successfully!', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash('Error approving lawyer. Please try again.', 'error')
    
    return redirect(url_for('admin.lawyer_detail', lawyer_id=lawyer_id))

@admin_bp.route('/lawyers/<lawyer_id>/reject', methods=['POST'])
@login_required
@admin_required
def reject_lawyer(lawyer_id):
    """Reject lawyer registration"""
    lawyer = LawyerProfile.query.get_or_404(lawyer_id)
    
    if lawyer.approval_status != 'pending':
        flash('This lawyer has already been processed.', 'warning')
        return redirect(url_for('admin.lawyer_detail', lawyer_id=lawyer_id))
    
    rejection_reason = request.form.get('rejection_reason')
    if not rejection_reason:
        flash('Please provide a rejection reason.', 'error')
        return redirect(url_for('admin.lawyer_detail', lawyer_id=lawyer_id))
    
    try:
        lawyer.approval_status = 'rejected'
        lawyer.rejection_reason = rejection_reason
        lawyer.approved_by_id = current_user.id
        lawyer.approved_at = datetime.utcnow()
        
        # Create notification for lawyer
        notification = Notification(
            recipient_id=lawyer.user_id,
            notification_type='lawyer_approved',  # Use same type but different message
            title='Account Rejected',
            message=f'Your lawyer account registration has been rejected. Reason: {rejection_reason}'
        )
        db.session.add(notification)
        
        # Log activity
        activity = ActivityLog(
            user_id=current_user.id,
            action='reject',
            model_name='LawyerProfile',
            object_id=lawyer_id,
            description=f'Rejected lawyer registration for {lawyer.user.get_full_name()}',
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string
        )
        db.session.add(activity)
        
        db.session.commit()
        flash('Lawyer rejected.', 'info')
        
    except Exception as e:
        db.session.rollback()
        flash('Error rejecting lawyer. Please try again.', 'error')
    
    return redirect(url_for('admin.lawyer_detail', lawyer_id=lawyer_id))

@admin_bp.route('/clients')
@login_required
@admin_required
def clients():
    """Manage clients"""
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search')
    
    query = User.query.filter_by(user_type='client')
    
    if search:
        query = query.filter(
            User.first_name.contains(search) |
            User.last_name.contains(search) |
            User.email.contains(search)
        )
    
    clients = query.order_by(desc(User.created_at)).paginate(
        page=page, per_page=15, error_out=False
    )
    
    return render_template('admin/clients.html', 
                         clients=clients,
                         current_search=search)

@admin_bp.route('/clients/<client_id>')
@login_required
@admin_required
def client_detail(client_id):
    """View client details"""
    client = User.query.filter_by(id=client_id, user_type='client').first_or_404()
    
    # Get client's cases
    client_cases = Case.query.filter_by(client_id=client_id).order_by(
        desc(Case.created_at)
    ).limit(10).all()
    
    # Get client's spending
    total_spent = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.client_id == client_id,
        Transaction.status == 'completed'
    ).scalar() or 0
    
    return render_template('admin/client_detail.html', 
                         client=client,
                         cases=client_cases,
                         total_spent=total_spent)

@admin_bp.route('/cases')
@login_required
@admin_required
def cases():
    """Manage all cases"""
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    service_filter = request.args.get('service')
    search = request.args.get('search')
    
    query = Case.query.join(User, Case.client_id == User.id)
    
    if status_filter:
        query = query.filter(Case.status == status_filter)
    
    if service_filter:
        query = query.filter(Case.legal_service_id == service_filter)
    
    if search:
        query = query.filter(
            Case.title.contains(search) |
            Case.case_number.contains(search) |
            User.first_name.contains(search) |
            User.last_name.contains(search)
        )
    
    cases = query.order_by(desc(Case.created_at)).paginate(
        page=page, per_page=15, error_out=False
    )
    
    services = LegalService.query.filter_by(is_active=True).all()
    
    return render_template('admin/cases.html', 
                         cases=cases,
                         services=services,
                         current_status=status_filter,
                         current_service=service_filter,
                         current_search=search)

@admin_bp.route('/cases/<case_id>')
@login_required
@admin_required
def case_detail(case_id):
    """View case details"""
    case = Case.query.get_or_404(case_id)
    
    # Get all related data
    documents = Document.query.filter_by(case_id=case_id).all()
    transactions = Transaction.query.filter_by(case_id=case_id).all()
    invoices = Invoice.query.filter_by(case_id=case_id).all()
    lawyer_requests = LawyerRequest.query.filter_by(case_id=case_id).all()
    messages = ChatMessage.query.filter_by(case_id=case_id).count()
    
    return render_template('admin/case_detail.html',
                         case=case,
                         documents=documents,
                         transactions=transactions,
                         invoices=invoices,
                         lawyer_requests=lawyer_requests,
                         message_count=messages)

@admin_bp.route('/transactions')
@login_required
@admin_required
def transactions():
    """Manage all transactions"""
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    type_filter = request.args.get('type')
    
    query = Transaction.query
    
    if status_filter:
        query = query.filter(Transaction.status == status_filter)
    
    if type_filter:
        query = query.filter(Transaction.transaction_type == type_filter)
    
    transactions = query.order_by(desc(Transaction.created_at)).paginate(
        page=page, per_page=20, error_out=False
    )
    
    return render_template('admin/transactions.html', 
                         transactions=transactions,
                         current_status=status_filter,
                         current_type=type_filter)

@admin_bp.route('/legal-services')
@login_required
@admin_required
def legal_services():
    """Manage legal services"""
    services = LegalService.query.order_by(LegalService.name).all()
    return render_template('admin/legal_services.html', services=services)

@admin_bp.route('/legal-services/create', methods=['GET', 'POST'])
@login_required
@admin_required
def create_legal_service():
    """Create new legal service"""
    if request.method == 'POST':
        try:
            data = request.get_json()
            service = LegalService(
                name=data.get('name'),
                description=data.get('description'),
                icon=data.get('icon')
            )

            db.session.add(service)
            db.session.commit()

            return jsonify({'message': 'Legal service created successfully!', 'service_id': service.id}), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Error creating service. Please try again.'}), 400
    
    return render_template('admin/create_legal_service.html')

@admin_bp.route('/legal-services/<service_id>/edit', methods=['GET', 'POST'])
@login_required
@admin_required
def edit_legal_service(service_id):
    """Edit legal service"""
    service = LegalService.query.get_or_404(service_id)
    
    if request.method == 'POST':
        try:
            data = request.get_json()
            service.name = data.get('name')
            service.description = data.get('description')
            service.icon = data.get('icon')
            service.is_active = bool(data.get('is_active'))
            
            db.session.commit()
            flash('Legal service updated successfully!', 'success')
            return redirect(url_for('admin.legal_services'))
            
        except Exception as e:
            db.session.rollback()
            flash('Error updating service. Please try again.', 'error')
    
    return render_template('admin/edit_legal_service.html', service=service)

@admin_bp.route('/settings')
@login_required
@admin_required
def settings():
    """System settings"""
    settings = SystemSettings.query.all()
    return render_template('admin/settings.html', settings=settings)

@admin_bp.route('/settings/<setting_id>/edit', methods=['POST'])
@login_required
@admin_required
def update_setting(setting_id):
    """Update system setting"""
    setting = SystemSettings.query.get_or_404(setting_id)
    
    try:
        data = request.get_json()
        setting.value = data.get('value')
        setting.updated_at = datetime.utcnow()

        db.session.commit()
        return jsonify({'message': 'Setting updated successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Error updating setting. Please try again.'}), 400

@admin_bp.route('/activity-logs')
@login_required
@admin_required
def activity_logs():
    """View system activity logs"""
    page = request.args.get('page', 1, type=int)
    action_filter = request.args.get('action')
    user_filter = request.args.get('user')
    
    query = ActivityLog.query.join(User)
    
    if action_filter:
        query = query.filter(ActivityLog.action == action_filter)
    
    if user_filter:
        query = query.filter(ActivityLog.user_id == user_filter)
    
    logs = query.order_by(desc(ActivityLog.created_at)).paginate(
        page=page, per_page=25, error_out=False
    )
    
    users = User.query.all()
    
    return render_template('admin/activity_logs.html', 
                         logs=logs,
                         users=users,
                         current_action=action_filter,
                         current_user=user_filter)

@admin_bp.route('/reports')
@login_required
@admin_required
def reports():
    """Generate system reports"""
    # Date range from request
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    # Default to last 30 days if no dates provided
    if not date_from:
        date_from = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')
    if not date_to:
        date_to = datetime.utcnow().strftime('%Y-%m-%d')
    
    # Convert to datetime objects
    start_date = datetime.strptime(date_from, '%Y-%m-%d')
    end_date = datetime.strptime(date_to, '%Y-%m-%d') + timedelta(days=1)
    
    # Generate report data
    report_data = {
        'period': f"{date_from} to {date_to}",
        'new_users': User.query.filter(
            User.created_at >= start_date,
            User.created_at < end_date
        ).count(),
        'new_cases': Case.query.filter(
            Case.created_at >= start_date,
            Case.created_at < end_date
        ).count(),
        'completed_transactions': Transaction.query.filter(
            Transaction.created_at >= start_date,
            Transaction.created_at < end_date,
            Transaction.status == 'completed'
        ).count(),
        'total_revenue': db.session.query(func.sum(Transaction.amount)).filter(
            Transaction.created_at >= start_date,
            Transaction.created_at < end_date,
            Transaction.status == 'completed'
        ).scalar() or 0,
        'lawyer_approvals': LawyerProfile.query.filter(
            LawyerProfile.approved_at >= start_date,
            LawyerProfile.approved_at < end_date,
            LawyerProfile.approval_status == 'approved'
        ).count()
    }
    
    return render_template('admin/reports.html', 
                         report_data=report_data,
                         date_from=date_from,
                         date_to=date_to)

@admin_bp.route('/api/dashboard-stats')
@login_required
@admin_required
def api_dashboard_stats():
    """API endpoint for dashboard statistics"""
    stats = {
        'total_users': User.query.count(),
        'pending_lawyers': LawyerProfile.query.filter_by(approval_status='pending').count(),
        'total_cases': Case.query.count(),
        'open_cases': Case.query.filter_by(status='open').count(),
        'total_revenue': float(db.session.query(func.sum(Transaction.amount)).filter(
            Transaction.status == 'completed'
        ).scalar() or 0),
        'pending_invoices': Invoice.query.filter_by(status='sent').count()
    }
    
    return jsonify(stats)