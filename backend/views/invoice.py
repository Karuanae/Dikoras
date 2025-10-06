from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Invoice, Transaction, Notification, User
from datetime import datetime, date, timedelta
from decimal import Decimal

invoice_bp = Blueprint("invoice_bp", __name__, url_prefix="/invoice")

# Get all invoices for current user
@invoice_bp.route("/", methods=["GET"])
@jwt_required()
def get_invoices():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Filter based on user type
    if user.user_type == 'client':
        invoices = Invoice.query.filter_by(client_id=current_user_id).all()
    elif user.user_type == 'lawyer':
        invoices = Invoice.query.filter_by(lawyer_id=current_user_id).all()
    else:  # admin
        invoices = Invoice.query.all()
    
    invoice_list = []
    for invoice in invoices:
        invoice_data = {
            "id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "amount": float(invoice.amount),
            "tax_amount": float(invoice.tax_amount),
            "total_amount": float(invoice.total_amount),
            "description": invoice.description,
            "status": invoice.status,
            "issue_date": invoice.issue_date.isoformat() if invoice.issue_date else None,
            "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
            "paid_date": invoice.paid_date.isoformat() if invoice.paid_date else None,
            "case_id": invoice.case_id,
            "client_name": invoice.client.get_full_name(),
            "lawyer_name": invoice.lawyer.get_full_name()
        }
        invoice_list.append(invoice_data)
    
    return jsonify(invoice_list), 200

# Get specific invoice
@invoice_bp.route("/<invoice_id>", methods=["GET"])
@jwt_required()
def get_invoice(invoice_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404
    
    # Check permissions
    if user.user_type == 'client' and invoice.client_id != current_user_id:
        return jsonify({"error": "Access denied"}), 403
    elif user.user_type == 'lawyer' and invoice.lawyer_id != current_user_id:
        return jsonify({"error": "Access denied"}), 403
    
    invoice_data = {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "amount": float(invoice.amount),
        "tax_amount": float(invoice.tax_amount),
        "total_amount": float(invoice.total_amount),
        "description": invoice.description,
        "status": invoice.status,
        "issue_date": invoice.issue_date.isoformat() if invoice.issue_date else None,
        "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
        "paid_date": invoice.paid_date.isoformat() if invoice.paid_date else None,
        "case": {
            "id": invoice.case.id,
            "title": invoice.case.title,
            "case_number": invoice.case.case_number
        },
        "client_name": invoice.client.get_full_name(),
        "lawyer_name": invoice.lawyer.get_full_name()
    }
    
    return jsonify(invoice_data), 200

# Create new invoice (lawyers only)
@invoice_bp.route("/", methods=["POST"])
@jwt_required()
def create_invoice():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.user_type != 'lawyer':
        return jsonify({"error": "Only lawyers can create invoices"}), 403
    
    data = request.get_json()
    
    case_id = data.get("case_id")
    amount = data.get("amount")
    description = data.get("description")
    tax_amount = data.get("tax_amount", 0)
    due_days = data.get("due_days", 30)
    
    if not all([case_id, amount, description]):
        return jsonify({"error": "Case ID, amount, and description are required"}), 400
    
    try:
        # Calculate due date
        due_date = date.today() + timedelta(days=int(due_days))
        
        invoice = Invoice(
            case_id=case_id,
            client_id=data.get("client_id"),  # Should be from case
            lawyer_id=current_user_id,
            amount=Decimal(str(amount)),
            tax_amount=Decimal(str(tax_amount)),
            total_amount=Decimal(str(amount)) + Decimal(str(tax_amount)),
            description=description,
            due_date=due_date,
            status='draft'
        )
        
        db.session.add(invoice)
        db.session.commit()
        
        return jsonify({
            "success": "Invoice created successfully",
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create invoice: {str(e)}"}), 400

# Send invoice to client
@invoice_bp.route("/<invoice_id>/send", methods=["PATCH"])
@jwt_required()
def send_invoice(invoice_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.user_type != 'lawyer':
        return jsonify({"error": "Only lawyers can send invoices"}), 403
    
    invoice = Invoice.query.filter_by(id=invoice_id, lawyer_id=current_user_id).first()
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404
    
    if invoice.status != 'draft':
        return jsonify({"error": "Only draft invoices can be sent"}), 400
    
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
        return jsonify({"success": "Invoice sent successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to send invoice"}), 400

# Pay invoice (clients only)
@invoice_bp.route("/<invoice_id>/pay", methods=["POST"])
@jwt_required()
def pay_invoice(invoice_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.user_type != 'client':
        return jsonify({"error": "Only clients can pay invoices"}), 403
    
    invoice = Invoice.query.filter_by(id=invoice_id, client_id=current_user_id).first()
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404
    
    if invoice.status != 'sent':
        return jsonify({"error": "Invoice cannot be paid"}), 400
    
    data = request.get_json()
    payment_method = data.get("payment_method", "credit_card")
    
    try:
        # Create transaction
        transaction = Transaction(
            case_id=invoice.case_id,
            client_id=current_user_id,
            lawyer_id=invoice.lawyer_id,
            transaction_type='payment',
            amount=invoice.total_amount,
            status='completed',  # In real app, would be 'pending' until payment gateway confirms
            description=f'Payment for invoice {invoice.invoice_number}',
            payment_method=payment_method,
            completed_at=datetime.utcnow()
        )
        db.session.add(transaction)
        
        # Update invoice
        invoice.status = 'paid'
        invoice.paid_date = date.today()
        invoice.transaction_id = transaction.id
        
        # Create notification for lawyer
        notification = Notification(
            recipient_id=invoice.lawyer_id,
            notification_type='payment_received',
            title='Payment Received',
            message=f'Payment of ${invoice.total_amount} received for invoice {invoice.invoice_number}',
            related_case_id=invoice.case_id
        )
        db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            "success": "Payment processed successfully",
            "transaction_id": transaction.id,
            "transaction_number": transaction.transaction_number
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Payment processing failed"}), 500

# Update invoice status (admin only)
@invoice_bp.route("/<invoice_id>/status", methods=["PATCH"])
@jwt_required()
def update_invoice_status(invoice_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.user_type != 'admin':
        return jsonify({"error": "Only admins can update invoice status"}), 403
    
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"error": "Invoice not found"}), 404
    
    data = request.get_json()
    new_status = data.get("status")
    
    valid_statuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
    if new_status not in valid_statuses:
        return jsonify({"error": "Invalid status"}), 400
    
    try:
        invoice.status = new_status
        db.session.commit()
        return jsonify({"success": "Invoice status updated successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update status"}), 400