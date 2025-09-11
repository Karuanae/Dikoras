from flask import Blueprint, request, jsonify
from models import db, User
from datetime import datetime

clients_bp = Blueprint('clients', __name__)

@clients_bp.route('/clients', methods=['GET'])
def get_clients():
    clients = User.query.filter_by(role='client').all()
    return jsonify({
        'clients': [{
            'id': client.id,
            'username': client.username,
            'email': client.email,
            'approved': client.approved,
            'registered_on': client.registered_on.isoformat() if client.registered_on else None
        } for client in clients]
    }), 200

# Filter clients by name
@clients_bp.route('/clients/search', methods=['GET'])
def search_clients():
    name = request.args.get('name')
    
    query = User.query.filter_by(role='client')
    
    if name:
        query = query.filter(User.username.ilike(f'%{name}%'))
    
    clients = query.all()
    
    return jsonify({
        'clients': [{
            'id': client.id,
            'username': client.username,
            'email': client.email,
            'approved': client.approved,
            'registered_on': client.registered_on.isoformat() if client.registered_on else None
        } for client in clients]
    }), 200

# Bulk delete clients
@clients_bp.route('/clients/bulk_delete', methods=['POST'])
def bulk_delete_clients():
    ids = request.json.get('ids', [])
    
    if not ids:
        return jsonify({'error': 'No client IDs provided'}), 400
    
    clients = User.query.filter(User.id.in_(ids), User.role == 'client').all()
    
    if not clients:
        return jsonify({'error': 'No clients found with the provided IDs'}), 404
    
    for client in clients:
        db.session.delete(client)
    
    db.session.commit()
    
    return jsonify({'message': f'{len(clients)} clients deleted successfully'}), 200

# Activate client
@clients_bp.route('/clients/<int:client_id>/activate', methods=['POST'])
def activate_client(client_id):
    client = User.query.filter_by(id=client_id, role='client').first()
    
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    client.approved = True
    db.session.commit()
    
    return jsonify({'message': 'Client activated successfully'}), 200

# Deactivate client
@clients_bp.route('/clients/<int:client_id>/deactivate', methods=['POST'])
def deactivate_client(client_id):
    client = User.query.filter_by(id=client_id, role='client').first()
    
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    client.approved = False
    db.session.commit()
    
    return jsonify({'message': 'Client deactivated successfully'}), 200

# Paginated list of clients
@clients_bp.route('/clients/paginated', methods=['GET'])
def paginated_clients():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    clients = User.query.filter_by(role='client').paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'clients': [{
            'id': client.id,
            'username': client.username,
            'email': client.email,
            'approved': client.approved,
            'registered_on': client.registered_on.isoformat() if client.registered_on else None
        } for client in clients.items],
        'page': page,
        'per_page': per_page,
        'total_pages': clients.pages,
        'total_items': clients.total
    }), 200

# Create client profile
@clients_bp.route('/clients', methods=['POST'])
def create_client():
    data = request.json
    
    # Validate required fields
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    # Create new client
    from werkzeug.security import generate_password_hash
    hashed_password = generate_password_hash(data['password'])
    
    new_client = User(
        username=data['username'],
        email=data['email'],
        password=hashed_password,
        role='client',
        approved=True  # Auto-approve clients
    )
    
    db.session.add(new_client)
    db.session.commit()
    
    return jsonify({
        'message': 'Client created successfully',
        'client': {
            'id': new_client.id,
            'username': new_client.username,
            'email': new_client.email,
            'role': new_client.role,
            'approved': new_client.approved
        }
    }), 201

# Get client detail
@clients_bp.route('/clients/<int:client_id>', methods=['GET'])
def get_client(client_id):
    client = User.query.filter_by(id=client_id, role='client').first()
    
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    return jsonify({
        'client': {
            'id': client.id,
            'username': client.username,
            'email': client.email,
            'approved': client.approved,
            'registered_on': client.registered_on.isoformat() if client.registered_on else None
        }
    }), 200

# Update client profile
@clients_bp.route('/clients/<int:client_id>', methods=['PUT', 'PATCH'])
def update_client(client_id):
    client = User.query.filter_by(id=client_id, role='client').first()
    
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    data = request.json
    
    if 'username' in data and data['username'] != client.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        client.username = data['username']
    
    if 'email' in data and data['email'] != client.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409
        client.email = data['email']
    
    if 'password' in data:
        from werkzeug.security import generate_password_hash
        client.password = generate_password_hash(data['password'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Client updated successfully',
        'client': {
            'id': client.id,
            'username': client.username,
            'email': client.email
        }
    }), 200

# Delete client profile
@clients_bp.route('/clients/<int:client_id>', methods=['DELETE'])
def delete_client(client_id):
    client = User.query.filter_by(id=client_id, role='client').first()
    
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    
    db.session.delete(client)
    db.session.commit()
    
    return jsonify({'message': 'Client deleted successfully'}), 200