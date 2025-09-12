from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from models import db, Case, LegalService, LawyerRequest, Document, Notification
from datetime import datetime
from werkzeug.utils import secure_filename
import os

case_bp = Blueprint('case', __name__)

@case_bp.route('/create')
@login_required
def create():
    """Create new case form"""
    if current_user.user_type != 'client':
        flash('Only clients can create cases.', 'error')
        return redirect(url_for('main.home'))
    
    service_id = request.args.get('service_id')
    services = LegalService.query.filter_by(is_active=True).all()
    selected_service = None
    
    if service_id:
        selected_service = LegalService.query.get(service_id)
    
    return render_template('case/create.html', 
                         services=services, 
                         selected_service=selected_service)

@case_bp.route('/create', methods=['POST'])
@login_required
def create_post():
    """Handle case creation"""
    if current_user.user_type != 'client':
        flash('Only clients can create cases.', 'error')
        return redirect(url_for('main.home'))
    
    try:
        case = Case(
            client_id=current_user.id,
            legal_service_id=request.get_json().get('legal_service_id'),
            title=request.get_json().get('title'),
            description=request.get_json().get('description'),
            priority=request.get_json().get('priority', 'medium'),
            budget=float(request.get_json().get('budget')) if request.get_json().get('budget') else None,
            deadline=datetime.strptime(request.get_json().get('deadline'), '%Y-%m-%d') if request.get_json().get('deadline') else None
        )
        
        db.session.add(case)
        db.session.commit()
        
        flash('Case created successfully!', 'success')
        return redirect(url_for('client.case_detail', case_id=case.id))
        
    except Exception as e:
        db.session.rollback()
        flash('Error creating case. Please try again.', 'error')
        return redirect(url_for('case.create'))

@case_bp.route('/<case_id>')
@login_required
def detail(case_id):
    """View case details - accessible by client, lawyer, or admin"""
    case = Case.query.get_or_404(case_id)
    
    # Check permissions
    if current_user.user_type == 'client' and case.client_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('client.cases'))
    elif current_user.user_type == 'lawyer' and case.lawyer_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('lawyer.cases'))
    elif current_user.user_type not in ['client', 'lawyer', 'admin']:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    
    # Get case documents
    documents = Document.query.filter_by(case_id=case_id).order_by(
        Document.created_at.desc()
    ).all()
    
    # Get lawyer requests if client or admin
    lawyer_requests = []
    if current_user.user_type in ['client', 'admin']:
        lawyer_requests = LawyerRequest.query.filter_by(case_id=case_id).order_by(
            LawyerRequest.created_at.desc()
        ).all()
    
    return render_template('case/detail.html',
                         case=case,
                         documents=documents,
                         lawyer_requests=lawyer_requests)

@case_bp.route('/<case_id>/update-status', methods=['POST'])
@login_required
def update_status(case_id):
    """Update case status"""
    case = Case.query.get_or_404(case_id)
    
    # Only lawyers and admins can update status
    if current_user.user_type == 'lawyer' and case.lawyer_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('case.detail', case_id=case_id))
    elif current_user.user_type not in ['lawyer', 'admin']:
        flash('Access denied.', 'error')
        return redirect(url_for('case.detail', case_id=case_id))
    
    data = request.get_json()
    new_status = data.get('status')
    valid_statuses = ['open', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled']
    
    if new_status not in valid_statuses:
        flash('Invalid status.', 'error')
        return redirect(url_for('case.detail', case_id=case_id))
    
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
    
    return redirect(url_for('case.detail', case_id=case_id))

@case_bp.route('/api/search')
@login_required
def api_search():
    """API endpoint for case search"""
    query = request.args.get('q', '')
    if len(query) < 2:
        return jsonify([])
    
    # Filter based on user type
    if current_user.user_type == 'client':
        cases = Case.query.filter(
            Case.client_id == current_user.id,
            Case.title.contains(query) | Case.case_number.contains(query)
        ).limit(10).all()
    elif current_user.user_type == 'lawyer':
        cases = Case.query.filter(
            Case.lawyer_id == current_user.id,
            Case.title.contains(query) | Case.case_number.contains(query)
        ).limit(10).all()
    else:  # admin
        cases = Case.query.filter(
            Case.title.contains(query) | Case.case_number.contains(query)
        ).limit(10).all()
    
    return jsonify([{
        'id': case.id,
        'case_number': case.case_number,
        'title': case.title,
        'status': case.status,
        'client_name': case.client.get_full_name(),
        'lawyer_name': case.lawyer.get_full_name() if case.lawyer else None
    } for case in cases])