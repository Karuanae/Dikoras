from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import (db, Case, LegalService, LawyerRequest, Notification, 
                   Transaction, Invoice, Document, User)
from werkzeug.security import generate_password_hash
from datetime import datetime
from decimal import Decimal

client_bp = Blueprint("client_bp", __name__, url_prefix="/client")

# Get client dashboard stats
@client_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def get_dashboard():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.user_type != 'client':
        return jsonify({"error": "Client access required"}), 403
    
    # Get client statistics
    total_cases = Case.query.filter_by(client_id=current_user_id).count()
    active_cases = Case.query.filter_by(client_id=current_user_id).filter(
        Case.status.in_(['open', 'assigned', 'in_progress'])
    ).count()
    resolved_cases = Case.query.filter_by(client_id=current_user_id, status='resolved').count()
    
    # Get recent cases
    recent_cases = Case.query.filter_by(client_id=current_user_id).order_by(
        Case.created_at.desc()
    ).limit(5).all()
    
    # Get recent notifications
    recent_notifications = Notification.query.filter_by(recipient_id=current_user_id).order_by(
        Notification.created_at.desc()
    ).limit(5).all()
    
    # Get pending lawyer requests
    pending_requests = LawyerRequest.query.join(Case).filter(
        Case.client_id == current_user_id,
        LawyerRequest.status == 'pending'
    ).count()
    
    # Get total spent
    total_spent = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.client_id == current_user_id,
        Transaction.status == 'completed'
    ).scalar() or 0
    
    dashboard_data = {
        "stats": {
            "total_cases": total_cases,
            "active_cases": active_cases,
            "resolved_cases": resolved_cases,
            "pending_requests": pending_requests,
            "total_spent": float(total_spent)
        },
        "recent_cases": [{
            "id": case.id,
            "case_number": case.case_number,
            "title": case.title,
            "status": case.status,
            "created_at": case.created_at.isoformat(),
            "legal_service": case.legal_service.name if case.legal_service else None
        } for case in recent_cases],
        "recent_notifications": [{
            "id": notif.id,
            "title": notif.title,
            "message": notif.message,
            "is_read": notif.is_read,
            "created_at": notif.created_at.isoformat()
        } for notif in recent_notifications]
    }
    
    return jsonify(dashboard_data), 200

# Get client profile
@client_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.user_type != 'client':
        return jsonify({"error": "Client access required"}), 403
    
    # Get available legal services
    services = LegalService.query.filter_by(is_active=True).all()
    
    profile_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "address": user.address,
        "created_at": user.created_at.isoformat(),
        "available_services": [{
            "id": service.id,
            "name": service.name,
            "description": service.description
        } for service in services]
    }
    
    return jsonify(profile_data), 200

# Update client profile
@client_bp.route("/profile", methods=["PATCH"])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.user_type != 'client':
        return jsonify({"error": "Client access required"}), 403
    
    data = request.get_json()
    
    try:
        # Update user information
        user.first_name = data.get('first_name')
        user.last_name = data.get('last_name')
        user.email = data.get('email')
        user.password_hash = generate_password_hash(data.get('password'))
        db.session.commit()
        return jsonify({"success": "Profile updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update profile"}), 400

# Get client cases
@client_bp.route("/cases", methods=["GET"])
@jwt_required()
def get_client_cases():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.user_type != 'client':
        return jsonify({"error": "Client access required"}), 403
    
    # Query parameters
    status_filter = request.args.get('status')
    service_filter = request.args.get('service')
    limit = request.args.get('limit', type=int)
    
    query = Case.query.filter_by(client_id=current_user_id)
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    if service_filter:
        query = query.filter_by(legal_service_id=service_filter)
    
    query = query.order_by(Case.created_at.desc())
    
    if limit:
        query = query.limit(limit)
    
    cases = query.all()
    
    cases_data = [{
        "id": case.id,
        "case_number": case.case_number,
        "title": case.title,
        "description": case.description,
        "status": case.status,
        "priority": case.priority,
        "budget": float(case.budget) if case.budget else None,
        "deadline": case.deadline.isoformat() if case.deadline else None,
        "created_at": case.created_at.isoformat(),
        "lawyer_name": case.lawyer.get_full_name() if case.lawyer else None,
        "legal_service": case.legal_service.name if case.legal_service else None
    } for case in cases]
    
    return jsonify(cases_data), 200

# Get specific case details
@client_bp.route("/cases/<case_id>", methods=["GET"])
@jwt_required()
def get_case_detail(case_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.user_type != 'client':
        return jsonify({"error": "Client access required"}), 403
    
    case = Case.query.filter_by(id=case_id, client_id=current_user_id).first()
    if not case:
        return jsonify({"error": "Case not found"}), 404
    
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
        "lawyer": {
            "id": case.lawyer.id,
            "name": case.lawyer.get_full_name(),
            "email": case.lawyer.email
        } if case.lawyer else None,
        "legal_service": {
            "id": case.legal_service.id,
            "name": case.legal_service.name
        } if case.legal_service else None,
        "lawyer_requests": [{
            "id": req.id,
            "lawyer_name": req.lawyer.get_full_name(),
            "message": req.message,
            "proposed_fee": float(req.proposed_fee) if req.proposed_fee else None,
            "status": req.status,
            "created_at": req.created_at.isoformat()
        } for req in lawyer_requests],
        "documents": [{
            "id": doc.id,
            "title": doc.title,
            "document_type": doc.document_type,
            "created_at": doc.created_at.isoformat(),
            "uploaded_by": doc.uploaded_by.get_full_name()
        } for doc in documents],
        "transactions": [{
            "id": txn.id,
            "transaction_number": txn.transaction_number,
            "transaction_type": txn.transaction_type,
            "amount": float(txn.amount),
            "status": txn.status,
            "created_at": txn.created_at.isoformat()
        } for txn in transactions],
        "invoices": [{
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "total_amount": float(inv.total_amount),
            "status": inv.status,
            "issue_date": inv.issue_date.isoformat(),
            "due_date": inv.due_date.isoformat()
        } for inv in invoices]
    }
    
    return jsonify(case_data), 200

# Accept lawyer request
@client_bp.route("/lawyer-requests/<request_id>/accept", methods=["POST"])
@jwt_required()
def accept_lawyer_request(request_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.user_type != 'client':
        return jsonify({"error": "Client access required"}), 403
    
    lawyer_request = LawyerRequest.query.get(request_id)
    if not lawyer_request:
        return jsonify({"error": "Lawyer request not found"}), 404
    
    # Verify this request belongs to client's case
    if lawyer_request.case.client_id != current_user_id:
        return jsonify({"error": "Access denied"}), 403
    
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
            message=f'Your request for case "{case.title}" has been accepted by {user.get_full_name()}',
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
        return jsonify({"success": "Lawyer request accepted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to accept request"}), 400

# Reject lawyer request
@client_bp.route("/lawyer-requests/<request_id>/reject", methods=["POST"])
@jwt_required()
def reject_lawyer_request(request_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.user_type != 'client':
        return jsonify({"error": "Client access required"}), 403
    
    lawyer_request = LawyerRequest.query.get(request_id)
    if not lawyer_request:
        return jsonify({"error": "Lawyer request not found"}), 404
    
    # Verify this request belongs to client's case
    if lawyer_request.case.client_id != current_user_id:
        return jsonify({"error": "Access denied"}), 403
    
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
        return jsonify({"success": "Lawyer request rejected"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to reject request"}), 400

# Get pending lawyer requests
@client_bp.route("/lawyer-requests", methods=["GET"])
@jwt_required()
def get_lawyer_requests():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.user_type != 'client':
        return jsonify({"error": "Client access required"}), 403
    
    requests = LawyerRequest.query.join(Case).filter(
        Case.client_id == current_user_id,
        LawyerRequest.status == 'pending'
    ).order_by(LawyerRequest.created_at.desc()).all()
    
    requests_data = [{
        "id": req.id,
        "case": {
            "id": req.case.id,
            "title": req.case.title,
            "case_number": req.case.case_number
        },
        "lawyer": {
            "id": req.lawyer.id,
            "name": req.lawyer.get_full_name(),
            "years_of_experience": req.lawyer.years_of_experience,
            "hourly_rate": float(req.lawyer.hourly_rate) if req.lawyer.hourly_rate else None
        },
        "message": req.message,
        "proposed_fee": float(req.proposed_fee) if req.proposed_fee else None,
        "created_at": req.created_at.isoformat()
    } for req in requests]
    
    return jsonify(requests_data), 200

# Get client statistics
@client_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_client_stats():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or user.user_type != 'client':
        return jsonify({"error": "Client access required"}), 403
    
    stats = {
        "total_cases": Case.query.filter_by(client_id=current_user_id).count(),
        "active_cases": Case.query.filter_by(client_id=current_user_id).filter(
            Case.status.in_(['open', 'assigned', 'in_progress'])
        ).count(),
        "resolved_cases": Case.query.filter_by(client_id=current_user_id, status='resolved').count(),
        "total_spent": float(db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.client_id == current_user_id,
            Transaction.status == 'completed'
        ).scalar() or 0),
        "pending_requests": LawyerRequest.query.join(Case).filter(
            Case.client_id == current_user_id,
            LawyerRequest.status == 'pending'
        ).count(),
        "unread_notifications": Notification.query.filter_by(
            recipient_id=current_user_id,
            is_read=False
        ).count()
    }
    
    return jsonify(stats), 200