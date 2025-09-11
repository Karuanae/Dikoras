
# invoice.py
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from models import db, Invoice, Case, Transaction, Notification
from datetime import datetime, date, timedelta
from decimal import Decimal

invoice_bp = Blueprint('invoice', __name__)

@invoice_bp.route('/')
@login_required
def list_invoices():
    """List user's invoices"""
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    
    if current_user.user_type == 'client':
        query = Invoice.query.filter_by(client_id=current_user.id)
    elif current_user.user_type == 'lawyer':
        query = Invoice.query.filter_by(lawyer_id=current_user.id)
    else:  # admin
        query = Invoice.query
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    invoices = query.order_by(Invoice.issue_date.desc()).paginate(
        page=page, per_page=15, error_out=False
    )
    
    return render_template('invoice/list.html', 
                         invoices=invoices,
                         current_status=status_filter)

@invoice_bp.route('/<invoice_id>')
@login_required
def detail(invoice_id):
    """View invoice details"""
    invoice = Invoice.query.get_or_404(invoice_id)
    
    # Check permissions
    if current_user.user_type == 'client' and invoice.client_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('invoice.list_invoices'))
    elif current_user.user_type == 'lawyer' and invoice.lawyer_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('invoice.list_invoices'))
    elif current_user.user_type not in ['client', 'lawyer', 'admin']:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    
    return render_template('invoice/detail.html', invoice=invoice)

@invoice_bp.route('/<invoice_id>/pay', methods=['POST'])
@login_required
def pay(invoice_id):
    """Process invoice payment"""
    if current_user.user_type != 'client':
        return jsonify({'error': 'Only clients can pay invoices'}), 403
    
    invoice = Invoice.query.filter_by(id=invoice_id, client_id=current_user.id).first_or_404()
    
    if invoice.status != 'sent':
        return jsonify({'error': 'Invoice cannot be paid'}), 400
    
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
            payment_method=request.json.get('payment_method'),
            completed_at=datetime.utcnow()
        )
        db.session.add(transaction)
        
        # Update invoice
        invoice.status = 'paid'
        invoice.paid_date = date.today()
        invoice.transaction_id = transaction.id
        
        # Create notifications
        notification_lawyer = Notification(
            recipient_id=invoice.lawyer_id,
            notification_type='payment_received',
            title='Payment Received',
            message=f'Payment of ${invoice.total_amount} received for invoice {invoice.invoice_number}',
            related_case_id=invoice.case_id
        )
        db.session.add(notification_lawyer)
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Payment processed successfully!'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Payment processing failed'}), 500