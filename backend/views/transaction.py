
import csv
from io import StringIO
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Transaction, User
from datetime import datetime
from decimal import Decimal

transaction_bp = Blueprint("transaction_bp", __name__, url_prefix="/transaction")

# Export transactions as CSV
@transaction_bp.route("/export", methods=["GET"])
@jwt_required()
def export_transactions():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Filter based on user type
    if user.user_type == 'client':
        query = Transaction.query.filter_by(client_id=current_user_id)
    elif user.user_type == 'lawyer':
        query = Transaction.query.filter_by(lawyer_id=current_user_id)
    else:  # admin
        query = Transaction.query

    transactions = query.order_by(Transaction.created_at.desc()).all()

    # Prepare CSV
    si = StringIO()
    writer = csv.writer(si)
    writer.writerow(["Transaction Number", "Type", "Amount", "Status", "Description", "Payment Method", "Payment Reference", "Created At"])
    for t in transactions:
        writer.writerow([
            t.transaction_number,
            t.transaction_type,
            float(t.amount),
            t.status,
            t.description,
            t.payment_method,
            t.payment_reference,
            t.created_at.strftime('%Y-%m-%d %H:%M:%S') if t.created_at else ''
        ])
    output = si.getvalue()

    return (
        output,
        200,
        {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=transactions.csv"
        }
    )

# Get all transactions for current user
@transaction_bp.route("/", methods=["GET"])
@jwt_required()
def get_transactions():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Query parameters for filtering
    status_filter = request.args.get('status')
    transaction_type_filter = request.args.get('type')
    case_id_filter = request.args.get('case_id')
    limit = request.args.get('limit', type=int)
    
    # Filter based on user type
    if user.user_type == 'client':
        query = Transaction.query.filter_by(client_id=current_user_id)
    elif user.user_type == 'lawyer':
        query = Transaction.query.filter_by(lawyer_id=current_user_id)
    else:  # admin
        query = Transaction.query
    
    # Apply filters
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    if transaction_type_filter:
        query = query.filter_by(transaction_type=transaction_type_filter)
    
    if case_id_filter:
        query = query.filter_by(case_id=case_id_filter)
    
    query = query.order_by(Transaction.created_at.desc())
    
    if limit:
        query = query.limit(limit)
    
    transactions = query.all()
    
    transaction_list = []
    for transaction in transactions:
        transaction_data = {
            "id": transaction.id,
            "transaction_number": transaction.transaction_number,
            "transaction_type": transaction.transaction_type,
            "amount": float(transaction.amount),
            "status": transaction.status,
            "description": transaction.description,
            "payment_method": transaction.payment_method,
            "payment_reference": transaction.payment_reference,
            "created_at": transaction.created_at.isoformat(),
            "completed_at": transaction.completed_at.isoformat() if transaction.completed_at else None,
            "case": {
                "id": transaction.case.id,
                "title": transaction.case.title,
                "case_number": transaction.case.case_number
            } if transaction.case else None,
            "client_name": transaction.client.get_full_name(),
            "lawyer_name": transaction.lawyer.get_full_name()
        }
        transaction_list.append(transaction_data)
    
    return jsonify(transaction_list), 200

# Get specific transaction
@transaction_bp.route("/<transaction_id>", methods=["GET"])
@jwt_required()
def get_transaction(transaction_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        return jsonify({"error": "Transaction not found"}), 404
    
    # Check permissions
    if user.user_type == 'client' and transaction.client_id != current_user_id:
        return jsonify({"error": "Access denied"}), 403
    elif user.user_type == 'lawyer' and transaction.lawyer_id != current_user_id:
        return jsonify({"error": "Access denied"}), 403
    
    transaction_data = {
        "id": transaction.id,
        "transaction_number": transaction.transaction_number,
        "transaction_type": transaction.transaction_type,
        "amount": float(transaction.amount),
        "status": transaction.status,
        "description": transaction.description,
        "payment_method": transaction.payment_method,
        "payment_reference": transaction.payment_reference,
        "created_at": transaction.created_at.isoformat(),
        "completed_at": transaction.completed_at.isoformat() if transaction.completed_at else None,
        "case": {
            "id": transaction.case.id,
            "title": transaction.case.title,
            "case_number": transaction.case.case_number
        } if transaction.case else None,
        "client": {
            "id": transaction.client.id,
            "name": transaction.client.get_full_name(),
            "email": transaction.client.email
        },
        "lawyer": {
            "id": transaction.lawyer.id,
            "name": transaction.lawyer.get_full_name(),
            "email": transaction.lawyer.email
        }
    }
    
    # Include invoice info if linked
    if transaction.invoice:
        transaction_data["invoice"] = {
            "id": transaction.invoice.id,
            "invoice_number": transaction.invoice.invoice_number
        }
    
    return jsonify(transaction_data), 200

# Create new transaction (admin only)
@transaction_bp.route("/", methods=["POST"])
@jwt_required()
def create_transaction():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.user_type != 'admin':
        return jsonify({"error": "Only admins can create transactions"}), 403
    
    data = request.get_json()
    
    case_id = data.get("case_id")
    client_id = data.get("client_id")
    lawyer_id = data.get("lawyer_id")
    transaction_type = data.get("transaction_type")
    amount = data.get("amount")
    description = data.get("description")
    payment_method = data.get("payment_method")
    status = data.get("status", "pending")
    
    if not all([case_id, client_id, lawyer_id, transaction_type, amount, description]):
        return jsonify({"error": "Case ID, client ID, lawyer ID, type, amount, and description are required"}), 400
    
    valid_types = ['payment', 'refund', 'fee', 'consultation']
    if transaction_type not in valid_types:
        return jsonify({"error": "Invalid transaction type"}), 400
    
    valid_statuses = ['pending', 'completed', 'failed', 'cancelled']
    if status not in valid_statuses:
        return jsonify({"error": "Invalid status"}), 400
    
    try:
        transaction = Transaction(
            case_id=case_id,
            client_id=client_id,
            lawyer_id=lawyer_id,
            transaction_type=transaction_type,
            amount=Decimal(str(amount)),
            status=status,
            description=description,
            payment_method=payment_method,
            completed_at=datetime.utcnow() if status == 'completed' else None
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            "success": "Transaction created successfully",
            "transaction_id": transaction.id,
            "transaction_number": transaction.transaction_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create transaction: {str(e)}"}), 400

# Update transaction status (admin only)
@transaction_bp.route("/<transaction_id>/status", methods=["PATCH"])
@jwt_required()
def update_transaction_status(transaction_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.user_type != 'admin':
        return jsonify({"error": "Only admins can update transaction status"}), 403
    
    transaction = Transaction.query.get(transaction_id)
    if not transaction:
        return jsonify({"error": "Transaction not found"}), 404
    
    data = request.get_json()
    new_status = data.get("status")
    
    valid_statuses = ['pending', 'completed', 'failed', 'cancelled']
    if new_status not in valid_statuses:
        return jsonify({"error": "Invalid status"}), 400
    
    try:
        old_status = transaction.status
        transaction.status = new_status
        
        # Set completion time if status changed to completed
        if new_status == 'completed' and old_status != 'completed':
            transaction.completed_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify({"success": "Transaction status updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update status"}), 400

# Get transaction statistics
@transaction_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_transaction_stats():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Filter based on user type
    if user.user_type == 'client':
        total_query = Transaction.query.filter_by(client_id=current_user_id)
        completed_query = Transaction.query.filter_by(client_id=current_user_id, status='completed')
    elif user.user_type == 'lawyer':
        total_query = Transaction.query.filter_by(lawyer_id=current_user_id)
        completed_query = Transaction.query.filter_by(lawyer_id=current_user_id, status='completed')
    else:  # admin
        total_query = Transaction.query
        completed_query = Transaction.query.filter_by(status='completed')
    
    total_transactions = total_query.count()
    completed_transactions = completed_query.count()
    pending_transactions = total_query.filter_by(status='pending').count()
    failed_transactions = total_query.filter_by(status='failed').count()
    
    # Calculate total amount
    total_amount = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.status == 'completed'
    )
    
    if user.user_type == 'client':
        total_amount = total_amount.filter(Transaction.client_id == current_user_id)
    elif user.user_type == 'lawyer':
        total_amount = total_amount.filter(Transaction.lawyer_id == current_user_id)
    
    total_amount = total_amount.scalar() or 0
    
    stats = {
        "total_transactions": total_transactions,
        "completed_transactions": completed_transactions,
        "pending_transactions": pending_transactions,
        "failed_transactions": failed_transactions,
        "total_amount": float(total_amount)
    }
    
    return jsonify(stats), 200

# Search transactions
@transaction_bp.route("/search", methods=["GET"])
@jwt_required()
def search_transactions():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    search_query = request.args.get('q', '')
    if len(search_query) < 2:
        return jsonify([]), 200
    
    # Filter based on user type
    if user.user_type == 'client':
        query = Transaction.query.filter_by(client_id=current_user_id)
    elif user.user_type == 'lawyer':
        query = Transaction.query.filter_by(lawyer_id=current_user_id)
    else:  # admin
        query = Transaction.query
    
    # Search in transaction number, description, and payment reference
    transactions = query.filter(
        Transaction.transaction_number.contains(search_query) |
        Transaction.description.contains(search_query) |
        Transaction.payment_reference.contains(search_query)
    ).limit(10).all()
    
    search_results = []
    for transaction in transactions:
        result = {
            "id": transaction.id,
            "transaction_number": transaction.transaction_number,
            "transaction_type": transaction.transaction_type,
            "amount": float(transaction.amount),
            "status": transaction.status,
            "description": transaction.description,
            "created_at": transaction.created_at.isoformat(),
            "case_title": transaction.case.title if transaction.case else None
        }
        search_results.append(result)
    
    return jsonify(search_results), 200