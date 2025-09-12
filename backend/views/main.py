from flask import Blueprint, render_template, request, jsonify
from models import db, LegalService, LawyerProfile, User

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def home():
    """Home page - displays legal services and featured lawyers"""
    services = LegalService.query.filter_by(is_active=True).all()
    featured_lawyers = LawyerProfile.query.filter_by(approval_status='approved').limit(6).all()
    return render_template('main/home.html', services=services, lawyers=featured_lawyers)

@main_bp.route('/services')
def services():
    """Display all legal services"""
    services = LegalService.query.filter_by(is_active=True).all()
    return render_template('main/services.html', services=services)

@main_bp.route('/services/<service_id>')
def service_detail(service_id):
    """Display specific legal service details and specialized lawyers"""
    service = LegalService.query.get_or_404(service_id)
    specialized_lawyers = LawyerProfile.query.filter(
        LawyerProfile.approval_status == 'approved',
        LawyerProfile.specializations.contains(service)
    ).all()
    return render_template('main/service_detail.html', service=service, lawyers=specialized_lawyers)

@main_bp.route('/lawyers')
def lawyers():
    """Display all approved lawyers"""
    page = request.args.get('page', 1, type=int)
    per_page = 12
    
    # Filter parameters
    specialization = request.args.get('specialization')
    search = request.args.get('search')
    
    query = LawyerProfile.query.filter_by(approval_status='approved')
    
    if specialization:
        service = LegalService.query.get(specialization)
        if service:
            query = query.filter(LawyerProfile.specializations.contains(service))
    
    if search:
        query = query.join(User).filter(
            User.first_name.contains(search) | 
            User.last_name.contains(search) |
            LawyerProfile.bio.contains(search)
        )
    
    lawyers = query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    services = LegalService.query.filter_by(is_active=True).all()
    
    return render_template('main/lawyers.html', 
                         lawyers=lawyers, 
                         services=services,
                         current_specialization=specialization,
                         current_search=search)

@main_bp.route('/lawyers/<lawyer_id>')
def lawyer_profile(lawyer_id):
    """Display lawyer profile details"""
    lawyer = LawyerProfile.query.get_or_404(lawyer_id)
    if lawyer.approval_status != 'approved':
        return render_template('errors/404.html'), 404
    
    return render_template('main/lawyer_profile.html', lawyer=lawyer)

@main_bp.route('/how-it-works')
def how_it_works():
    """How it works page"""
    return render_template('main/how_it_works.html')

@main_bp.route('/about')
def about():
    """About page"""
    return render_template('main/about.html')

@main_bp.route('/contact')
def contact():
    """Contact page"""
    return render_template('main/contact.html')

@main_bp.route('/contact', methods=['POST'])
def contact_submit():
    """Handle contact form submission"""
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    subject = data.get('subject')
    message = data.get('message')
    
    # Here you would typically send an email or save to database
    # For now, just return success response
    
    return jsonify({
        'success': True,
        'message': 'Thank you for your message. We will get back to you soon!'
    })

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

@main_bp.route('/api/lawyers/search')
def api_lawyers_search():
    """API endpoint for lawyer search autocomplete"""
    query = request.args.get('q', '')
    if len(query) < 2:
        return jsonify([])
    
    lawyers = LawyerProfile.query.join(User).filter(
        LawyerProfile.approval_status == 'approved',
        User.first_name.contains(query) | User.last_name.contains(query)
    ).limit(10).all()
    
    return jsonify([{
        'id': lawyer.id,
        'name': lawyer.user.get_full_name(),
        'specializations': [spec.name for spec in lawyer.specializations]
    } for lawyer in lawyers])