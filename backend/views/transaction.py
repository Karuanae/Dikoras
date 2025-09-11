
# transaction.py
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from models import db, Transaction, Case, Notification
from datetime import datetime
from decimal import Decimal

transaction_bp = Blueprint('transaction', __name__)

@transaction_bp.route('/')
@login_required
def list_transactions():
    """List user's transactions"""
    page = request.args.get('page', 1, type=int)
    status_filter = request.args.get('status')
    
    if current_user.user_type == 'client':
        query = Transaction.query.filter_by(client_id=current_user.id)
    elif current_user.user_type == 'lawyer':
        query = Transaction.query.filter_by(lawyer_id=current_user.id)
    else:  # admin
        query = Transaction.query
    
    if status_filter:
        query = query.filter_by(status=status_filter)
    
    transactions = query.order_by(Transaction.created_at.desc()).paginate(
        page=page, per_page=15, error_out=False
    )
    
    return render_template('transaction/list.html', 
                         transactions=transactions,
                         current_status=status_filter)

@transaction_bp.route('/<transaction_id>')
@login_required
def detail(transaction_id):
    """View transaction details"""
    transaction = Transaction.query.get_or_404(transaction_id)
    
    # Check permissions
    if current_user.user_type == 'client' and transaction.client_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('transaction.list_transactions'))
    elif current_user.user_type == 'lawyer' and transaction.lawyer_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('transaction.list_transactions'))
    elif current_user.user_type not in ['client', 'lawyer', 'admin']:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    
    return render_template('transaction/detail.html', transaction=transaction)