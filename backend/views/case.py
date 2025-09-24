from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Case, LegalService, LawyerRequest, Document, Notification, User
from datetime import datetime
from decimal import Decimal

case_bp = Blueprint("case_bp", __name__, url_prefix="/case")

# Get all cases for current user
@case_bp.route("/", methods=["GET"])
@jwt_required()
def get_cases():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Query parameters for filtering
    status_filter = request.args.get('status')
    priority_filter = request.args.get('priority')
    service_filter = request.args.get('service')
    limit = request.args.get('limit', type=int)
    
    # Filter based on user type
    if user.user_type == 'client':
        query = Case.query.filter_by(client_id=current_user_id)
    elif user.user_type == 'lawyer':
        query = Case.query.filter_by(lawyer_id=current_user_id)
    else:  # admin
        query = Case.query
    
    # Apply filters
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    if priority_filter:
        query = query.filter_by(priority=priority_filter)
    
    if service_filter:
        query = query.filter_by(legal_service_id=service_filter)
    
    query = query.order_by(Case.created_at.desc())
    
    if limit:
        query = query.limit(limit)
    
    cases = query.all()
    
    case_list = []
    for case in cases:
        case_data = {
            "id": case.id,
            "case_number": case.case_number,
            "title": case.title,
            "description": case.description,
            "status": case.status,
            "priority": case.priority,
            "budget": float(case.budget) if case.budget else None,
            "deadline": case.deadline.isoformat() if case.deadline else None,
            "created_at": case.created_at.isoformat(),
            "updated_at": case.updated_at.isoformat(),
            "assigned_at": case.assigned_at.isoformat() if case.assigned_at else None,
            "resolved_at": case.resolved_at.isoformat() if case.resolved_at else None,
            "client_name": case.client.get_full_name(),
            "lawyer_name": case.lawyer.get_full_name() if case.lawyer else None,
            "legal_service": {
                "id": case.legal_service.id,
                "name": case.legal_service.name
            } if case.legal_service else None
        }
        case_list.append(case_data)
    
    return jsonify(case_list), 200

# Get specific case
@case_bp.route("/<case_id>", methods=["GET"])
@jwt_required()
def get_case(case_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    case = Case.query.get(case_id)
    if not case:
        return jsonify({"error": "Case not found"}), 404
    
    # Check permissions
    if user.user_type == 'client' and case.client_id != current_user_id:
        return jsonify({"error": "Access denied"}), 403
    elif user.user_type == 'lawyer' and case.lawyer_id != current_user_id:
        return jsonify({"error": "Access denied"}), 403
    
    # Get case documents
    documents = Document.query.filter_by(case_id=case_id).order_by(
        Document.created_at.desc()
    ).all()
    
    # Get lawyer requests (for clients and admins)
    lawyer_requests = []
    if user.user_type in ['client', 'admin']:
        requests = LawyerRequest.query.filter_by(case_id=case_id).order_by(
            LawyerRequest.created_at.desc()
        ).all()
        
        for req in requests:
            lawyer_requests.append({
                "id": req.id,
                "lawyer_name": req.lawyer.get_full_name(),
                "message": req.message,
                "proposed_fee": float(req.proposed_fee) if req.proposed_fee else None,
                "status": req.status,
                "created_at": req.created_at.isoformat(),
                "responded_at": req.responded_at.isoformat() if req.responded_at else None
            })
    
    case_data = {
        "id": case.id,
        "case_number": case.case_number,
        "title": case.title,
        "description": case.description,
        "status": case.status,
        "priority": case.priority,
        "budget": float(case.budget) if case.budget else None,
        "deadline": case.deadline.isoformat() if case.deadline else None,
        "created_at": case.created_at.isoformat(),
        "updated_at": case.updated_at.isoformat(),
        "assigned_at": case.assigned_at.isoformat() if case.assigned_at else None,
        "resolved_at": case.resolved_at.isoformat() if case.resolved_at else None,
        "client": {
            "id": case.client.id,
            "name": case.client.get_full_name(),
            "email": case.client.email
        },
        "lawyer": {
            "id": case.lawyer.id,
            "name": case.lawyer.get_full_name(),
            "email": case.lawyer.email
        } if case.lawyer else None,
        "legal_service": {
            "id": case.legal_service.id,
            "name": case.legal_service.name,
            "description": case.legal_service.description
        } if case.legal_service else None,
        "documents": [{
            "id": doc.id,
            "title": doc.title,
            "document_type": doc.document_type,
            "created_at": doc.created_at.isoformat(),
            "uploaded_by": doc.uploaded_by.get_full_name()
        } for doc in documents],
        "lawyer_requests": lawyer_requests
    }
    
    return jsonify(case_data), 200

# Create new case (clients only)
@case_bp.route("/", methods=["POST"])
@jwt_required()
def create_case():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.user_type != 'client':
        return jsonify({"error": "Only clients can create cases"}), 403
    
    data = request.get_json()
    
    legal_service_id = data.get("legal_service_id")
    title = data.get("title")
    description = data.get("description")
    priority = data.get("priority", "medium")
    budget = data.get("budget")
    deadline = data.get("deadline")
    
    if not all([legal_service_id, title, description]):
        return jsonify({"error": "Legal service ID, title, and description are required"}), 400
    
    # Validate legal service exists
    legal_service = LegalService.query.get(legal_service_id)
    if not legal_service or not legal_service.is_active:
        return jsonify({"error": "Invalid legal service"}), 400
    
    # Validate priority
    valid_priorities = ['low', 'medium', 'high', 'urgent']
    if priority not in valid_priorities:
        return jsonify({"error": "Invalid priority"}), 400
    
    try:
        case = Case(
            client_id=current_user_id,
            legal_service_id=legal_service_id,
            title=title,
            description=description,
            priority=priority,
            budget=Decimal(str(budget)) if budget else None,
            deadline=datetime.strptime(deadline, '%Y-%m-%d') if deadline else None,
            status='open'
        )
        
        db.session.add(case)
        db.session.commit()
        
        # Create notification for admin
        admin = User.query.filter_by(user_type='admin').first()
        if admin:
            notification = Notification(
                recipient_id=admin.id,
                notification_type='case_status_update',
                title='New Case Created',
                message=f'A new case "{case.title}" has been created by {user.get_full_name()}',
                related_case_id=case.id
            )
            db.session.add(notification)
            db.session.commit()
        
        return jsonify({
            "success": "Case created successfully",
            "case_id": case.id,
            "case_number": case.case_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create case: {str(e)}"}), 400

# Update case status (lawyers and admins only)
@case_bp.route("/<case_id>/status", methods=["PATCH"])
@jwt_required()
def update_case_status(case_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    case = Case.query.get(case_id)
    if not case:
        return jsonify({"error": "Case not found"}), 404
    
    # Check permissions
    if user.user_type == 'lawyer' and case.lawyer_id != current_user_id:
        return jsonify({"error": "Access denied"}), 403
    elif user.user_type not in ['lawyer', 'admin']:
        return jsonify({"error": "Only lawyers and admins can update case status"}), 403
    
    data = request.get_json()
    new_status = data.get("status")
    
    valid_statuses = ['open', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled']
    if new_status not in valid_statuses:
        return jsonify({"error": "Invalid status"}), 400
    
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
        return jsonify({"success": "Case status updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update case status"}), 400

# Search cases
@case_bp.route("/search", methods=["GET"])
@jwt_required()
def search_cases():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    search_query = request.args.get('q', '')
    if len(search_query) < 2:
        return jsonify([]), 200
    
    # Filter based on user type
    if user.user_type == 'client':
        query = Case.query.filter_by(client_id=current_user_id)
    elif user.user_type == 'lawyer':
        query = Case.query.filter_by(lawyer_id=current_user_id)
    else:  # admin
        query = Case.query
    
    # Search in case title and case number
    cases = query.filter(
        Case.title.contains(search_query) | 
        Case.case_number.contains(search_query)
    ).limit(10).all()
    
    search_results = []
    for case in cases:
        result = {
            "id": case.id,
            "case_number": case.case_number,
            "title": case.title,
            "status": case.status,
            "priority": case.priority,
            "client_name": case.client.get_full_name(),
            "lawyer_name": case.lawyer.get_full_name() if case.lawyer else None,
            "created_at": case.created_at.isoformat()
        }
        search_results.append(result)
    
    return jsonify(search_results), 200

# Get available cases for lawyers
@case_bp.route("/available", methods=["GET"])
@jwt_required()
def get_available_cases():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.user_type != 'lawyer':
        return jsonify({"error": "Only lawyers can view available cases"}), 403
    
    if user.approval_status != 'approved':
        return jsonify({"error": "Lawyer account not approved"}), 403
    
    # Get lawyer's specializations
    specialization_list = user.specializations.split(',') if user.specializations else []
    if not specialization_list:
        return jsonify([]), 200
    
    specialization_ids = [int(id) for id in specialization_list]
    
    # Query parameters
    priority_filter = request.args.get('priority')
    service_filter = request.args.get('service')
    limit = request.args.get('limit', 20, type=int)
    
    query = Case.query.filter(
        Case.status == 'open',
        Case.legal_service_id.in_(specialization_ids)
    )
    
    if priority_filter:
        query = query.filter_by(priority=priority_filter)
    
    if service_filter:
        query = query.filter_by(legal_service_id=service_filter)
    
    cases = query.order_by(Case.created_at.desc()).limit(limit).all()
    
    # Get lawyer's existing requests
    lawyer_request_case_ids = [req.case_id for req in LawyerRequest.query.filter_by(
        lawyer_id=current_user_id
    ).all()]
    
    case_list = []
    for case in cases:
        case_data = {
            "id": case.id,
            "case_number": case.case_number,
            "title": case.title,
            "description": case.description[:200] + "..." if len(case.description) > 200 else case.description,
            "priority": case.priority,
            "budget": float(case.budget) if case.budget else None,
            "deadline": case.deadline.isoformat() if case.deadline else None,
            "created_at": case.created_at.isoformat(),
            "client_name": case.client.get_full_name(),
            "legal_service": case.legal_service.name,
            "already_requested": case.id in lawyer_request_case_ids
        }
        case_list.append(case_data)
    
    return jsonify(case_list), 200

# Get case statistics
@case_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_case_stats():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Filter based on user type
    if user.user_type == 'client':
        query = Case.query.filter_by(client_id=current_user_id)
    elif user.user_type == 'lawyer':
        query = Case.query.filter_by(lawyer_id=current_user_id)
    else:  # admin
        query = Case.query
    
    total_cases = query.count()
    open_cases = query.filter_by(status='open').count()
    assigned_cases = query.filter_by(status='assigned').count()
    in_progress_cases = query.filter_by(status='in_progress').count()
    resolved_cases = query.filter_by(status='resolved').count()
    closed_cases = query.filter_by(status='closed').count()
    
    stats = {
        "total_cases": total_cases,
        "open_cases": open_cases,
        "assigned_cases": assigned_cases,
        "in_progress_cases": in_progress_cases,
        "resolved_cases": resolved_cases,
        "closed_cases": closed_cases,
        "active_cases": assigned_cases + in_progress_cases
    }
    
    return jsonify(stats), 200