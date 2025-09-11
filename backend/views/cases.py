from flask import Blueprint, request, jsonify
from models import db, Case, Document, Invoice, Message, Transaction, User
from datetime import datetime

cases_bp = Blueprint('cases', __name__)

@cases_bp.route('/cases', methods=['GET'])
def get_cases():
    cases = Case.query.all()
    return jsonify({
        'cases': [{
            'id': case.id,
            'title': case.title,
            'description': case.description,
            'client_id': case.client_id,
            'lawyer_id': case.lawyer_id,
            'status': case.status,
            'created_at': case.created_at.isoformat() if case.created_at else None
        } for case in cases]
    }), 200

# Filter cases by status or title
@cases_bp.route('/cases/search', methods=['GET'])
def search_cases():
    status = request.args.get('status')
    title = request.args.get('title')
    
    query = Case.query
    
    if status:
        query = query.filter_by(status=status)
    if title:
        query = query.filter(Case.title.ilike(f'%{title}%'))
    
    cases = query.all()
    
    return jsonify({
        'cases': [{
            'id': case.id,
            'title': case.title,
            'description': case.description,
            'client_id': case.client_id,
            'lawyer_id': case.lawyer_id,
            'status': case.status,
            'created_at': case.created_at.isoformat() if case.created_at else None
        } for case in cases]
    }), 200

# Bulk delete cases
@cases_bp.route('/cases/bulk_delete', methods=['POST'])
def bulk_delete_cases():
    ids = request.json.get('ids', [])
    
    if not ids:
        return jsonify({'error': 'No case IDs provided'}), 400
    
    cases = Case.query.filter(Case.id.in_(ids)).all()
    
    if not cases:
        return jsonify({'error': 'No cases found with the provided IDs'}), 404
    
    for case in cases:
        db.session.delete(case)
    
    db.session.commit()
    
    return jsonify({'message': f'{len(cases)} cases deleted successfully'}), 200

# Change case status
@cases_bp.route('/cases/<int:case_id>/status', methods=['POST'])
def change_case_status(case_id):
    case = Case.query.get(case_id)
    
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    status = request.json.get('status')
    
    if not status:
        return jsonify({'error': 'Status is required'}), 400
    
    case.status = status
    db.session.commit()
    
    return jsonify({'message': 'Case status updated successfully'}), 200

# Paginated list of cases
@cases_bp.route('/cases/paginated', methods=['GET'])
def paginated_cases():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    cases = Case.query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'cases': [{
            'id': case.id,
            'title': case.title,
            'description': case.description,
            'client_id': case.client_id,
            'lawyer_id': case.lawyer_id,
            'status': case.status,
            'created_at': case.created_at.isoformat() if case.created_at else None
        } for case in cases.items],
        'page': page,
        'per_page': per_page,
        'total_pages': cases.pages,
        'total_items': cases.total
    }), 200

@cases_bp.route('/cases', methods=['POST'])
def create_case():
    data = request.json
    
    # Validate required fields
    required_fields = ['title', 'description', 'client_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if client exists
    client = User.query.filter_by(id=data['client_id'], role='client').first()
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    # Check if lawyer exists if provided
    lawyer_id = data.get('lawyer_id')
    if lawyer_id:
        lawyer = User.query.filter_by(id=lawyer_id, role='lawyer').first()
        if not lawyer:
            return jsonify({'error': 'Lawyer not found'}), 404
    
    new_case = Case(
        title=data['title'],
        description=data['description'],
        client_id=data['client_id'],
        lawyer_id=lawyer_id,
        status=data.get('status', 'open')
    )
    
    db.session.add(new_case)
    db.session.commit()
    
    return jsonify({
        'message': 'Case created successfully',
        'case': {
            'id': new_case.id,
            'title': new_case.title,
            'description': new_case.description,
            'client_id': new_case.client_id,
            'lawyer_id': new_case.lawyer_id,
            'status': new_case.status,
            'created_at': new_case.created_at.isoformat() if new_case.created_at else None
        }
    }), 201

# Get case detail
@cases_bp.route('/cases/<int:case_id>', methods=['GET'])
def get_case(case_id):
    case = Case.query.get(case_id)
    
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    return jsonify({
        'case': {
            'id': case.id,
            'title': case.title,
            'description': case.description,
            'client_id': case.client_id,
            'lawyer_id': case.lawyer_id,
            'status': case.status,
            'created_at': case.created_at.isoformat() if case.created_at else None,
            'client_name': case.user.username if case.user else None,
            'lawyer_name': User.query.get(case.lawyer_id).username if case.lawyer_id else None
        }
    }), 200

# Update case
@cases_bp.route('/cases/<int:case_id>', methods=['PUT', 'PATCH'])
def update_case(case_id):
    case = Case.query.get(case_id)
    
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    data = request.json
    
    if 'title' in data:
        case.title = data['title']
    if 'description' in data:
        case.description = data['description']
    if 'client_id' in data:
        client = User.query.filter_by(id=data['client_id'], role='client').first()
        if not client:
            return jsonify({'error': 'Client not found'}), 404
        case.client_id = data['client_id']
    if 'lawyer_id' in data:
        if data['lawyer_id']:
            lawyer = User.query.filter_by(id=data['lawyer_id'], role='lawyer').first()
            if not lawyer:
                return jsonify({'error': 'Lawyer not found'}), 404
        case.lawyer_id = data['lawyer_id']
    if 'status' in data:
        case.status = data['status']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Case updated successfully',
        'case': {
            'id': case.id,
            'title': case.title,
            'description': case.description,
            'client_id': case.client_id,
            'lawyer_id': case.lawyer_id,
            'status': case.status
        }
    }), 200

# Delete case
@cases_bp.route('/cases/<int:case_id>', methods=['DELETE'])
def delete_case(case_id):
    case = Case.query.get(case_id)
    
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    db.session.delete(case)
    db.session.commit()
    
    return jsonify({'message': 'Case deleted successfully'}), 200

# CRUD for documents
@cases_bp.route('/cases/<int:case_id>/documents', methods=['GET'])
def get_documents(case_id):
    case = Case.query.get(case_id)
    
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    return jsonify({
        'documents': [{
            'id': doc.id,
            'case_id': doc.case_id,
            'filename': doc.filename,
            'url': doc.url,
            'uploaded_at': doc.uploaded_at.isoformat() if doc.uploaded_at else None
        } for doc in case.documents]
    }), 200

@cases_bp.route('/cases/<int:case_id>/documents', methods=['POST'])
def create_document(case_id):
    case = Case.query.get(case_id)
    
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    data = request.json
    
    required_fields = ['filename', 'url']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    new_document = Document(
        case_id=case_id,
        filename=data['filename'],
        url=data['url']
    )
    
    db.session.add(new_document)
    db.session.commit()
    
    return jsonify({
        'message': 'Document created successfully',
        'document': {
            'id': new_document.id,
            'case_id': new_document.case_id,
            'filename': new_document.filename,
            'url': new_document.url,
            'uploaded_at': new_document.uploaded_at.isoformat() if new_document.uploaded_at else None
        }
    }), 201

@cases_bp.route('/documents/<int:doc_id>', methods=['GET'])
def get_document(doc_id):
    document = Document.query.get(doc_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    return jsonify({
        'document': {
            'id': document.id,
            'case_id': document.case_id,
            'filename': document.filename,
            'url': document.url,
            'uploaded_at': document.uploaded_at.isoformat() if document.uploaded_at else None
        }
    }), 200

@cases_bp.route('/documents/<int:doc_id>', methods=['PUT', 'PATCH'])
def update_document(doc_id):
    document = Document.query.get(doc_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    data = request.json
    
    if 'filename' in data:
        document.filename = data['filename']
    if 'url' in data:
        document.url = data['url']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Document updated successfully',
        'document': {
            'id': document.id,
            'case_id': document.case_id,
            'filename': document.filename,
            'url': document.url
        }
    }), 200

@cases_bp.route('/documents/<int:doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    document = Document.query.get(doc_id)
    
    if not document:
        return jsonify({'error': 'Document not found'}), 404
    
    db.session.delete(document)
    db.session.commit()
    
    return jsonify({'message': 'Document deleted successfully'}), 200

# CRUD for invoices
@cases_bp.route('/cases/<int:case_id>/invoices', methods=['GET'])
def get_invoices(case_id):
    case = Case.query.get(case_id)
    
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    return jsonify({
        'invoices': [{
            'id': invoice.id,
            'case_id': invoice.case_id,
            'amount': invoice.amount,
            'issued_at': invoice.issued_at.isoformat() if invoice.issued_at else None,
            'paid': invoice.paid
        } for invoice in case.invoices]
    }), 200

@cases_bp.route('/cases/<int:case_id>/invoices', methods=['POST'])
def create_invoice(case_id):
    case = Case.query.get(case_id)
    
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    data = request.json
    
    if 'amount' not in data:
        return jsonify({'error': 'Amount is required'}), 400
    
    new_invoice = Invoice(
        case_id=case_id,
        amount=data['amount'],
        paid=data.get('paid', False)
    )
    
    db.session.add(new_invoice)
    db.session.commit()
    
    return jsonify({
        'message': 'Invoice created successfully',
        'invoice': {
            'id': new_invoice.id,
            'case_id': new_invoice.case_id,
            'amount': new_invoice.amount,
            'issued_at': new_invoice.issued_at.isoformat() if new_invoice.issued_at else None,
            'paid': new_invoice.paid
        }
    }), 201

@cases_bp.route('/invoices/<int:invoice_id>', methods=['GET'])
def get_invoice(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    
    return jsonify({
        'invoice': {
            'id': invoice.id,
            'case_id': invoice.case_id,
            'amount': invoice.amount,
            'issued_at': invoice.issued_at.isoformat() if invoice.issued_at else None,
            'paid': invoice.paid
        }
    }), 200

@cases_bp.route('/invoices/<int:invoice_id>', methods=['PUT', 'PATCH'])
def update_invoice(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    
    data = request.json
    
    if 'amount' in data:
        invoice.amount = data['amount']
    if 'paid' in data:
        invoice.paid = data['paid']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Invoice updated successfully',
        'invoice': {
            'id': invoice.id,
            'case_id': invoice.case_id,
            'amount': invoice.amount,
            'paid': invoice.paid
        }
    }), 200

@cases_bp.route('/invoices/<int:invoice_id>', methods=['DELETE'])
def delete_invoice(invoice_id):
    invoice = Invoice.query.get(invoice_id)
    
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    
    db.session.delete(invoice)
    db.session.commit()
    
    return jsonify({'message': 'Invoice deleted successfully'}), 200

# CRUD for messages
@cases_bp.route('/cases/<int:case_id>/messages', methods=['GET'])
def get_messages(case_id):
    case = Case.query.get(case_id)
    
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    return jsonify({
        'messages': [{
            'id': msg.id,
            'sender_id': msg.sender_id,
            'receiver_id': msg.receiver_id,
            'case_id': msg.case_id,
            'content': msg.content,
            'sent_at': msg.sent_at.isoformat() if msg.sent_at else None,
            'sender_name': User.query.get(msg.sender_id).username if User.query.get(msg.sender_id) else None,
            'receiver_name': User.query.get(msg.receiver_id).username if User.query.get(msg.receiver_id) else None
        } for msg in case.messages]
    }), 200

@cases_bp.route('/cases/<int:case_id>/messages', methods=['POST'])
def create_message(case_id):
    case = Case.query.get(case_id)
    
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    data = request.json
    
    required_fields = ['sender_id', 'receiver_id', 'content']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if sender exists
    sender = User.query.get(data['sender_id'])
    if not sender:
        return jsonify({'error': 'Sender not found'}), 404
    
    # Check if receiver exists
    receiver = User.query.get(data['receiver_id'])
    if not receiver:
        return jsonify({'error': 'Receiver not found'}), 404
    
    new_message = Message(
        sender_id=data['sender_id'],
        receiver_id=data['receiver_id'],
        case_id=case_id,
        content=data['content']
    )
    
    db.session.add(new_message)
    db.session.commit()
    
    return jsonify({
        'message': 'Message created successfully',
        'message_data': {
            'id': new_message.id,
            'sender_id': new_message.sender_id,
            'receiver_id': new_message.receiver_id,
            'case_id': new_message.case_id,
            'content': new_message.content,
            'sent_at': new_message.sent_at.isoformat() if new_message.sent_at else None
        }
    }), 201

@cases_bp.route('/messages/<int:msg_id>', methods=['GET'])
def get_message(msg_id):
    message = Message.query.get(msg_id)
    
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    return jsonify({
        'message': {
            'id': message.id,
            'sender_id': message.sender_id,
            'receiver_id': message.receiver_id,
            'case_id': message.case_id,
            'content': message.content,
            'sent_at': message.sent_at.isoformat() if message.sent_at else None,
            'sender_name': User.query.get(message.sender_id).username if User.query.get(message.sender_id) else None,
            'receiver_name': User.query.get(message.receiver_id).username if User.query.get(message.receiver_id) else None
        }
    }), 200

@cases_bp.route('/messages/<int:msg_id>', methods=['PUT', 'PATCH'])
def update_message(msg_id):
    message = Message.query.get(msg_id)
    
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    data = request.json
    
    if 'content' in data:
        message.content = data['content']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Message updated successfully',
        'message_data': {
            'id': message.id,
            'sender_id': message.sender_id,
            'receiver_id': message.receiver_id,
            'case_id': message.case_id,
            'content': message.content
        }
    }), 200

@cases_bp.route('/messages/<int:msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    message = Message.query.get(msg_id)
    
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    db.session.delete(message)
    db.session.commit()
    
    return jsonify({'message': 'Message deleted successfully'}), 200

# CRUD for transactions
@cases_bp.route('/cases/<int:case_id>/transactions', methods=['GET'])
def get_transactions(case_id):
    case = Case.query.get(case_id)
    
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    return jsonify({
        'transactions': [{
            'id': trans.id,
            'case_id': trans.case_id,
            'amount': trans.amount,
            'transaction_date': trans.transaction_date.isoformat() if trans.transaction_date else None,
            'status': trans.status
        } for trans in case.transactions]
    }), 200

@cases_bp.route('/cases/<int:case_id>/transactions', methods=['POST'])
def create_transaction(case_id):
    case = Case.query.get(case_id)
    
    if not case:
        return jsonify({'error': 'Case not found'}), 404
    
    data = request.json
    
    if 'amount' not in data:
        return jsonify({'error': 'Amount is required'}), 400
    
    new_transaction = Transaction(
        case_id=case_id,
        amount=data['amount'],
        status=data.get('status', 'pending')
    )
    
    db.session.add(new_transaction)
    db.session.commit()
    
    return jsonify({
        'message': 'Transaction created successfully',
        'transaction': {
            'id': new_transaction.id,
            'case_id': new_transaction.case_id,
            'amount': new_transaction.amount,
            'transaction_date': new_transaction.transaction_date.isoformat() if new_transaction.transaction_date else None,
            'status': new_transaction.status
        }
    }), 201

@cases_bp.route('/transactions/<int:trans_id>', methods=['GET'])
def get_transaction(trans_id):
    transaction = Transaction.query.get(trans_id)
    
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    return jsonify({
        'transaction': {
            'id': transaction.id,
            'case_id': transaction.case_id,
            'amount': transaction.amount,
            'transaction_date': transaction.transaction_date.isoformat() if transaction.transaction_date else None,
            'status': transaction.status
        }
    }), 200

@cases_bp.route('/transactions/<int:trans_id>', methods=['PUT', 'PATCH'])
def update_transaction(trans_id):
    transaction = Transaction.query.get(trans_id)
    
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    data = request.json
    
    if 'amount' in data:
        transaction.amount = data['amount']
    if 'status' in data:
        transaction.status = data['status']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Transaction updated successfully',
        'transaction': {
            'id': transaction.id,
            'case_id': transaction.case_id,
            'amount': transaction.amount,
            'status': transaction.status
        }
    }), 200

@cases_bp.route('/transactions/<int:trans_id>', methods=['DELETE'])
def delete_transaction(trans_id):
    transaction = Transaction.query.get(trans_id)
    
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    db.session.delete(transaction)
    db.session.commit()
    
    return jsonify({'message': 'Transaction deleted successfully'}), 200