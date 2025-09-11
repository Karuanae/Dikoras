from flask import Blueprint, request, jsonify
from models import db, User, LawyerProfile
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

# Approve lawyer
@admin_bp.route('/admin/approve_lawyer/<int:lawyer_id>', methods=['POST'])
def approve_lawyer(lawyer_id):
    lawyer = User.query.filter_by(id=lawyer_id, role='lawyer').first()
    if not lawyer:
        return jsonify({'error': 'Lawyer not found'}), 404
    
    lawyer_profile = LawyerProfile.query.filter_by(user_id=lawyer_id).first()
    if not lawyer_profile:
        return jsonify({'error': 'Lawyer profile not found'}), 404
    
    lawyer_profile.approved = True
    lawyer.approved = True
    db.session.commit()
    
    return jsonify({'message': 'Lawyer approved successfully'}), 200

# Reject lawyer
@admin_bp.route('/admin/reject_lawyer/<int:lawyer_id>', methods=['POST'])
def reject_lawyer(lawyer_id):
    lawyer = User.query.filter_by(id=lawyer_id, role='lawyer').first()
    if not lawyer:
        return jsonify({'error': 'Lawyer not found'}), 404
    
    lawyer_profile = LawyerProfile.query.filter_by(user_id=lawyer_id).first()
    if not lawyer_profile:
        return jsonify({'error': 'Lawyer profile not found'}), 404
    
    lawyer_profile.approved = False
    lawyer.approved = False
    db.session.commit()
    
    return jsonify({'message': 'Lawyer rejected'}), 200

# List all users
@admin_bp.route('/admin/users', methods=['GET'])
def list_users():
    users = User.query.all()
    return jsonify({
        'users': [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'approved': user.approved,
            'registered_on': user.registered_on.isoformat() if user.registered_on else None
        } for user in users]
    }), 200

# Search users by name or role
@admin_bp.route('/admin/users/search', methods=['GET'])
def search_users():
    name = request.args.get('name')
    role = request.args.get('role')
    
    query = User.query
    
    if name:
        query = query.filter(User.username.ilike(f'%{name}%'))
    if role:
        query = query.filter_by(role=role)
    
    users = query.all()
    
    return jsonify({
        'users': [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'approved': user.approved,
            'registered_on': user.registered_on.isoformat() if user.registered_on else None
        } for user in users]
    }), 200

# Bulk delete users
@admin_bp.route('/admin/users/bulk_delete', methods=['POST'])
def bulk_delete_users():
    ids = request.json.get('ids', [])
    
    if not ids:
        return jsonify({'error': 'No user IDs provided'}), 400
    
    users = User.query.filter(User.id.in_(ids)).all()
    
    if not users:
        return jsonify({'error': 'No users found with the provided IDs'}), 404
    
    for user in users:
        db.session.delete(user)
    
    db.session.commit()
    
    return jsonify({'message': f'{len(users)} users deleted successfully'}), 200

# Paginated list of users
@admin_bp.route('/admin/users/paginated', methods=['GET'])
def paginated_users():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    
    users = User.query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'users': [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'approved': user.approved,
            'registered_on': user.registered_on.isoformat() if user.registered_on else None
        } for user in users.items],
        'page': page,
        'per_page': per_page,
        'total_pages': users.pages,
        'total_items': users.total
    }), 200

# Delete user
@admin_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200