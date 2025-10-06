from flask import Blueprint, request, jsonify
from models import db, LegalService, User
from datetime import datetime

main_bp = Blueprint('main', __name__, url_prefix='/main')
@main_bp.route('/api/services', methods=['POST'])
def add_legal_service():
    data = request.get_json()
    required_fields = ['name', 'description', 'category', 'service_type', 'pricing_model']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400

    service = LegalService(
        name=data['name'],
        description=data['description'],
        icon=data.get('icon', ''),
        is_active=data.get('is_active', True)
    )
    db.session.add(service)
    db.session.commit()
    return jsonify({'success': True, 'id': service.id}), 201

@main_bp.route("/", methods=["GET"])
def api_home():
    return jsonify({
        "message": "Welcome to Dikoras Legal Platform API", 
        "version": "1.0",
        "timestamp": datetime.utcnow().isoformat()
    }), 200

@main_bp.route('/api/services')
def api_services():
    """API endpoint to get all active legal services"""
    services = LegalService.query.filter_by(is_active=True).all()
    return jsonify([{
        'id': service.id,
        'name': service.name,
        'description': service.description,
        'icon': service.icon
    } for service in services])

@main_bp.route('/api/lawyers')
def api_lawyers():
    """API endpoint to get all approved lawyers"""
    # Since you don't have LawyerProfile, we'll use User model with user_type='lawyer'
    lawyers = User.query.filter_by(
        user_type='lawyer', 
        approval_status='approved',
        is_active=True
    ).all()
    
    return jsonify([{
        'id': lawyer.id,
        'name': lawyer.get_full_name(),
        'email': lawyer.email,
        'years_of_experience': lawyer.years_of_experience,
        'specializations': lawyer.specializations,
        'bio': lawyer.bio,
        'hourly_rate': float(lawyer.hourly_rate) if lawyer.hourly_rate else None,
        'education': lawyer.education
    } for lawyer in lawyers])

@main_bp.route('/api/lawyers/search')
def api_lawyers_search():
    """API endpoint for lawyer search"""
    query = request.args.get('q', '')
    specialization = request.args.get('specialization')
    
    lawyers_query = User.query.filter_by(
        user_type='lawyer', 
        approval_status='approved',
        is_active=True
    )
    
    if query and len(query) >= 2:
        lawyers_query = lawyers_query.filter(
            User.first_name.contains(query) | 
            User.last_name.contains(query) |
            User.bio.contains(query)
        )
    
    if specialization:
        lawyers_query = lawyers_query.filter(
            User.specializations.contains(specialization)
        )
    
    lawyers = lawyers_query.limit(20).all()
    
    return jsonify([{
        'id': lawyer.id,
        'name': lawyer.get_full_name(),
        'specializations': lawyer.specializations,
        'years_of_experience': lawyer.years_of_experience,
        'hourly_rate': float(lawyer.hourly_rate) if lawyer.hourly_rate else None
    } for lawyer in lawyers])

@main_bp.route('/api/health')
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        db_status = 'healthy'
    except Exception as e:
        db_status = 'unhealthy'
    
    return jsonify({
        "status": "healthy",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0"
    })

@main_bp.route('/api/stats')
def api_stats():
    """API endpoint for platform statistics"""
    total_lawyers = User.query.filter_by(
        user_type='lawyer', 
        approval_status='approved',
        is_active=True
    ).count()
    
    total_services = LegalService.query.filter_by(is_active=True).count()
    
    # You can add more stats as needed
    from models import Case
    total_cases = Case.query.count()
    
    return jsonify({
        'total_lawyers': total_lawyers,
        'total_services': total_services,
        'total_cases': total_cases
    })

@main_bp.route('/api/contact', methods=['POST'])
def contact_submit():
    """Handle contact form submission"""
    data = request.get_json()
    
    if not data:
        return jsonify({
            'success': False,
            'message': 'No data provided'
        }), 400
    
    name = data.get('name')
    email = data.get('email')
    subject = data.get('subject')
    message = data.get('message')
    
    # Validate required fields
    if not all([name, email, message]):
        return jsonify({
            'success': False,
            'message': 'Name, email, and message are required'
        }), 400
    
    # Here you would typically:
    # 1. Save to a contact_requests table
    # 2. Send an email notification
    # For now, just return success response
    
    return jsonify({
        'success': True,
        'message': 'Thank you for your message. We will get back to you soon!',
        'data': {
            'name': name,
            'email': email,
            'subject': subject
        }
    })

@main_bp.route('/api/how-it-works')
def how_it_works():
    """API endpoint for how it works information"""
    return jsonify({
        'steps': [
            {
                'step': 1,
                'title': 'Choose a Service',
                'description': 'Select the legal service you need from our comprehensive list'
            },
            {
                'step': 2,
                'title': 'Find a Lawyer',
                'description': 'Browse through our verified lawyers and choose the right one for you'
            },
            {
                'step': 3,
                'title': 'Get Legal Help',
                'description': 'Connect with your lawyer and get the legal assistance you need'
            }
        ]
    })