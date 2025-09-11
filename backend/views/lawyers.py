from flask import Blueprint, request, jsonify
from models import db, User, LawyerProfile, LegalService
from datetime import datetime

lawyers_bp = Blueprint('lawyers', __name__)

@lawyers_bp.route('/lawyers', methods=['GET'])
def get_lawyers():
    lawyers = User.query.filter_by(role='lawyer').all()
    return jsonify({
        'lawyers': [{
            'id': lawyer.id,
            'username': lawyer.username,
            'email': lawyer.email,
            'approved': lawyer.approved,
            'registered_on': lawyer.registered_on.isoformat() if lawyer.registered_on else None,
            'profile': {
                'bio': lawyer.lawyer_profile.bio if lawyer.lawyer_profile else None,
                'services': lawyer.lawyer_profile.services if lawyer.lawyer_profile else None,
                'profile_approved': lawyer.lawyer_profile.approved if lawyer.lawyer_profile else False
            } if lawyer.lawyer_profile else None
        } for lawyer in lawyers]
    }), 200

# Filter lawyers by name or service
@lawyers_bp.route('/lawyers/search', methods=['GET'])
def search_lawyers():
    name = request.args.get('name')
    service = request.args.get('service')
    
    query = User.query.filter_by(role='lawyer')
    
    if name:
        query = query.filter(User.username.ilike(f'%{name}%'))
    
    if service:
        query = query.join(LawyerProfile).filter(LawyerProfile.services.ilike(f'%{service}%'))
    
    lawyers = query.all()
    
    return jsonify({
        'lawyers': [{
            'id': lawyer.id,
            'username': lawyer.username,
            'email': lawyer.email,
            'approved': lawyer.approved,
            'registered_on': lawyer.registered_on.isoformat() if lawyer.registered_on else None,
            'profile': {
                'bio': lawyer.lawyer_profile.bio if lawyer.lawyer_profile else None,
                'services': lawyer.lawyer_profile.services if lawyer.lawyer_profile else None,
                'profile_approved': lawyer.lawyer_profile.approved if lawyer.lawyer_profile else False
            } if lawyer.lawyer_profile else None
        } for lawyer in lawyers]
    }), 200

# Bulk delete lawyers
@lawyers_bp.route('/lawyers/bulk_delete', methods=['POST'])
def bulk_delete_lawyers():
    ids = request.json.get('ids', [])
    
    if not ids:
        return jsonify({'error': 'No lawyer IDs provided'}), 400
    
    lawyers = User.query.filter(User.id.in_(ids), User.role == 'lawyer').all()
    
    if not lawyers:
        return jsonify({'error': 'No lawyers found with the provided IDs'}), 404
    
    for lawyer in lawyers:
        # Delete lawyer profile if exists
        if lawyer.lawyer_profile:
            db.session.delete(lawyer.lawyer_profile)
        db.session.delete(lawyer)
    
    db.session.commit()
    
    return jsonify({'message': f'{len(lawyers)} lawyers deleted successfully'}), 200

# Activate lawyer
@lawyers_bp.route('/lawyers/<int:lawyer_id>/activate', methods=['POST'])
def activate_lawyer(lawyer_id):
    lawyer = User.query.filter_by(id=lawyer_id, role='lawyer').first()
    
    if not lawyer:
        return jsonify({'error': 'Lawyer not found'}), 404
    
    lawyer.approved = True
    
    # Also activate lawyer profile if exists
    if lawyer.lawyer_profile:
        lawyer.lawyer_profile.approved = True
    
    db.session.commit()
    
    return jsonify({'message': 'Lawyer activated successfully'}), 200

# Deactivate lawyer
@lawyers_bp.route('/lawyers/<int:lawyer_id>/deactivate', methods=['POST'])
def deactivate_lawyer(lawyer_id):
    lawyer = User.query.filter_by(id=lawyer_id, role='lawyer').first()
    
    if not lawyer:
        return jsonify({'error': 'Lawyer not found'}), 404
    
    lawyer.approved = False
    
    # Also deactivate lawyer profile if exists
    if lawyer.lawyer_profile:
        lawyer.lawyer_profile.approved = False
    
    db.session.commit()
    
    return jsonify({'message': 'Lawyer deactivated successfully'}), 200

# Paginated list of lawyers
@lawyers_bp.route('/lawyers/paginated', methods=['GET'])
def paginated_lawyers():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    lawyers = User.query.filter_by(role='lawyer').paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'lawyers': [{
            'id': lawyer.id,
            'username': lawyer.username,
            'email': lawyer.email,
            'approved': lawyer.approved,
            'registered_on': lawyer.registered_on.isoformat() if lawyer.registered_on else None,
            'profile': {
                'bio': lawyer.lawyer_profile.bio if lawyer.lawyer_profile else None,
                'services': lawyer.lawyer_profile.services if lawyer.lawyer_profile else None,
                'profile_approved': lawyer.lawyer_profile.approved if lawyer.lawyer_profile else False
            } if lawyer.lawyer_profile else None
        } for lawyer in lawyers.items],
        'page': page,
        'per_page': per_page,
        'total_pages': lawyers.pages,
        'total_items': lawyers.total
    }), 200

@lawyers_bp.route('/lawyers/<int:lawyer_id>', methods=['GET'])
def get_lawyer(lawyer_id):
    lawyer = User.query.filter_by(id=lawyer_id, role='lawyer').first()
    
    if not lawyer:
        return jsonify({'error': 'Lawyer not found'}), 404
    
    return jsonify({
        'lawyer': {
            'id': lawyer.id,
            'username': lawyer.username,
            'email': lawyer.email,
            'approved': lawyer.approved,
            'registered_on': lawyer.registered_on.isoformat() if lawyer.registered_on else None,
            'profile': {
                'id': lawyer.lawyer_profile.id if lawyer.lawyer_profile else None,
                'bio': lawyer.lawyer_profile.bio if lawyer.lawyer_profile else None,
                'services': lawyer.lawyer_profile.services if lawyer.lawyer_profile else None,
                'approved': lawyer.lawyer_profile.approved if lawyer.lawyer_profile else False
            } if lawyer.lawyer_profile else None
        }
    }), 200

# Create lawyer profile
@lawyers_bp.route('/lawyers', methods=['POST'])
def create_lawyer():
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
    
    # Create new lawyer
    from werkzeug.security import generate_password_hash
    hashed_password = generate_password_hash(data['password'])
    
    new_lawyer = User(
        username=data['username'],
        email=data['email'],
        password=hashed_password,
        role='lawyer',
        approved=False  # Lawyers need approval
    )
    
    db.session.add(new_lawyer)
    db.session.commit()
    
    # Create lawyer profile if bio or services are provided
    if 'bio' in data or 'services' in data:
        lawyer_profile = LawyerProfile(
            user_id=new_lawyer.id,
            bio=data.get('bio'),
            services=data.get('services'),
            approved=False
        )
        db.session.add(lawyer_profile)
        db.session.commit()
    
    return jsonify({
        'message': 'Lawyer created successfully. Waiting for approval.',
        'lawyer': {
            'id': new_lawyer.id,
            'username': new_lawyer.username,
            'email': new_lawyer.email,
            'role': new_lawyer.role,
            'approved': new_lawyer.approved
        }
    }), 201

# Update lawyer profile
@lawyers_bp.route('/lawyers/<int:lawyer_id>', methods=['PUT', 'PATCH'])
def update_lawyer(lawyer_id):
    lawyer = User.query.filter_by(id=lawyer_id, role='lawyer').first()
    
    if not lawyer:
        return jsonify({'error': 'Lawyer not found'}), 404
    
    data = request.json
    
    if 'username' in data and data['username'] != lawyer.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        lawyer.username = data['username']
    
    if 'email' in data and data['email'] != lawyer.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409
        lawyer.email = data['email']
    
    if 'password' in data:
        from werkzeug.security import generate_password_hash
        lawyer.password = generate_password_hash(data['password'])
    
    # Update or create lawyer profile
    if 'bio' in data or 'services' in data:
        if lawyer.lawyer_profile:
            if 'bio' in data:
                lawyer.lawyer_profile.bio = data['bio']
            if 'services' in data:
                lawyer.lawyer_profile.services = data['services']
        else:
            lawyer_profile = LawyerProfile(
                user_id=lawyer_id,
                bio=data.get('bio'),
                services=data.get('services'),
                approved=False
            )
            db.session.add(lawyer_profile)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Lawyer updated successfully',
        'lawyer': {
            'id': lawyer.id,
            'username': lawyer.username,
            'email': lawyer.email,
            'profile': {
                'bio': lawyer.lawyer_profile.bio if lawyer.lawyer_profile else None,
                'services': lawyer.lawyer_profile.services if lawyer.lawyer_profile else None
            } if lawyer.lawyer_profile else None
        }
    }), 200

# Delete lawyer profile
@lawyers_bp.route('/lawyers/<int:lawyer_id>', methods=['DELETE'])
def delete_lawyer(lawyer_id):
    lawyer = User.query.filter_by(id=lawyer_id, role='lawyer').first()
    
    if not lawyer:
        return jsonify({'error': 'Lawyer not found'}), 404
    
    # Delete lawyer profile if exists
    if lawyer.lawyer_profile:
        db.session.delete(lawyer.lawyer_profile)
    
    db.session.delete(lawyer)
    db.session.commit()
    
    return jsonify({'message': 'Lawyer deleted successfully'}), 200

# CRUD for legal services
@lawyers_bp.route('/legal_services', methods=['GET'])
def get_legal_services():
    services = LegalService.query.all()
    return jsonify({
        'legal_services': [{
            'id': service.id,
            'name': service.name,
            'description': service.description,
            'price': service.price
        } for service in services]
    }), 200

@lawyers_bp.route('/legal_services', methods=['POST'])
def create_legal_service():
    data = request.json
    
    required_fields = ['name', 'price']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    new_service = LegalService(
        name=data['name'],
        description=data.get('description'),
        price=data['price']
    )
    
    db.session.add(new_service)
    db.session.commit()
    
    return jsonify({
        'message': 'Legal service created successfully',
        'legal_service': {
            'id': new_service.id,
            'name': new_service.name,
            'description': new_service.description,
            'price': new_service.price
        }
    }), 201

@lawyers_bp.route('/legal_services/<int:service_id>', methods=['GET'])
def get_legal_service(service_id):
    service = LegalService.query.get(service_id)
    
    if not service:
        return jsonify({'error': 'Legal service not found'}), 404
    
    return jsonify({
        'legal_service': {
            'id': service.id,
            'name': service.name,
            'description': service.description,
            'price': service.price
        }
    }), 200

@lawyers_bp.route('/legal_services/<int:service_id>', methods=['PUT', 'PATCH'])
def update_legal_service(service_id):
    service = LegalService.query.get(service_id)
    
    if not service:
        return jsonify({'error': 'Legal service not found'}), 404
    
    data = request.json
    
    if 'name' in data:
        service.name = data['name']
    if 'description' in data:
        service.description = data['description']
    if 'price' in data:
        service.price = data['price']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Legal service updated successfully',
        'legal_service': {
            'id': service.id,
            'name': service.name,
            'description': service.description,
            'price': service.price
        }
    }), 200

@lawyers_bp.route('/legal_services/<int:service_id>', methods=['DELETE'])
def delete_legal_service(service_id):
    service = LegalService.query.get(service_id)
    
    if not service:
        return jsonify({'error': 'Legal service not found'}), 404
    
    db.session.delete(service)
    db.session.commit()
    
    return jsonify({'message': 'Legal service deleted successfully'}), 200