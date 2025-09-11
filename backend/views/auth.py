from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from models import db, User, ClientProfile, LawyerProfile, LegalService, ActivityLog
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login')
def login():
    """Login page"""
    if current_user.is_authenticated:
        return redirect_user_to_dashboard()
    
    # Get selected service from session for client flow
    selected_service = session.get('selected_service')
    return render_template('auth/login.html', selected_service=selected_service)

@auth_bp.route('/login', methods=['POST'])
def login_post():
    """Handle login form submission"""
    username = request.form.get('username')
    password = request.form.get('password')
    remember_me = bool(request.form.get('remember_me'))
    
    if not username or not password:
        flash('Please enter both username and password.', 'error')
        return redirect(url_for('auth.login'))
    
    # Find user by username or email
    user = User.query.filter(
        (User.username == username) | (User.email == username)
    ).first()
    
    if not user or not user.check_password(password):
        flash('Invalid username or password.', 'error')
        return redirect(url_for('auth.login'))
    
    if not user.is_active:
        flash('Your account has been deactivated. Please contact support.', 'error')
        return redirect(url_for('auth.login'))
    
    # Check if lawyer is approved
    if user.user_type == 'lawyer' and user.lawyer_profile.approval_status != 'approved':
        flash('Your lawyer account is pending approval.', 'warning')
        return redirect(url_for('lawyer.pending_approval'))
    
    # Log the login activity
    log_activity(user, 'login', description=f'User logged in')
    
    login_user(user, remember=remember_me)
    
    # Redirect to appropriate dashboard
    next_page = request.args.get('next')
    if next_page:
        return redirect(next_page)
    
    return redirect_user_to_dashboard()

@auth_bp.route('/register')
def register():
    """Registration selection page"""
    if current_user.is_authenticated:
        return redirect_user_to_dashboard()
    
    services = LegalService.query.filter_by(is_active=True).all()
    selected_service = session.get('selected_service')
    return render_template('auth/register.html', services=services, selected_service=selected_service)

@auth_bp.route('/register/client')
def register_client():
    """Client registration form"""
    if current_user.is_authenticated:
        return redirect_user_to_dashboard()
    
    services = LegalService.query.filter_by(is_active=True).all()
    selected_service_id = request.args.get('service') or session.get('selected_service')
    selected_service = None
    if selected_service_id:
        selected_service = LegalService.query.get(selected_service_id)
    
    return render_template('auth/register_client.html', 
                         services=services, 
                         selected_service=selected_service)

@auth_bp.route('/register/client', methods=['POST'])
def register_client_post():
    """Handle client registration"""
    # Get form data
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    confirm_password = request.form.get('confirm_password')
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    phone = request.form.get('phone')
    address = request.form.get('address')
    company_name = request.form.get('company_name')
    national_id = request.form.get('national_id')
    preferred_services = request.form.getlist('preferred_services')
    
    # Validation
    if not all([username, email, password, first_name, last_name]):
        flash('Please fill in all required fields.', 'error')
        return redirect(url_for('auth.register_client'))
    
    if password != confirm_password:
        flash('Passwords do not match.', 'error')
        return redirect(url_for('auth.register_client'))
    
    if len(password) < 6:
        flash('Password must be at least 6 characters long.', 'error')
        return redirect(url_for('auth.register_client'))
    
    # Check if username or email already exists
    if User.query.filter_by(username=username).first():
        flash('Username already exists.', 'error')
        return redirect(url_for('auth.register_client'))
    
    if User.query.filter_by(email=email).first():
        flash('Email already registered.', 'error')
        return redirect(url_for('auth.register_client'))
    
    try:
        # Create user
        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            address=address,
            user_type='client'
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create client profile
        client_profile = ClientProfile(
            user_id=user.id,
            company_name=company_name,
            national_id=national_id
        )
        
        db.session.add(client_profile)
        
        # Add preferred services
        if preferred_services:
            services = LegalService.query.filter(LegalService.id.in_(preferred_services)).all()
            client_profile.preferred_services.extend(services)
        
        db.session.commit()
        
        # Log activity
        log_activity(user, 'create', description='Client account created')
        
        # Auto login
        login_user(user)
        flash('Registration successful! Welcome to our platform.', 'success')
        
        # Clear selected service from session
        session.pop('selected_service', None)
        
        return redirect(url_for('client.dashboard'))
        
    except Exception as e:
        db.session.rollback()
        flash('Registration failed. Please try again.', 'error')
        return redirect(url_for('auth.register_client'))

@auth_bp.route('/register/lawyer')
def register_lawyer():
    """Lawyer registration form"""
    if current_user.is_authenticated:
        return redirect_user_to_dashboard()
    
    services = LegalService.query.filter_by(is_active=True).all()
    return render_template('auth/register_lawyer.html', services=services)

@auth_bp.route('/register/lawyer', methods=['POST'])
def register_lawyer_post():
    """Handle lawyer registration"""
    # Get form data
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    confirm_password = request.form.get('confirm_password')
    first_name = request.form.get('first_name')
    last_name = request.form.get('last_name')
    phone = request.form.get('phone')
    address = request.form.get('address')
    license_number = request.form.get('license_number')
    years_of_experience = request.form.get('years_of_experience')
    education = request.form.get('education')
    bar_association = request.form.get('bar_association')
    specializations = request.form.getlist('specializations')
    hourly_rate = request.form.get('hourly_rate')
    bio = request.form.get('bio')
    certifications = request.form.get('certifications')
    
    # Validation
    if not all([username, email, password, first_name, last_name, 
                license_number, years_of_experience, education, bar_association]):
        flash('Please fill in all required fields.', 'error')
        return redirect(url_for('auth.register_lawyer'))
    
    if password != confirm_password:
        flash('Passwords do not match.', 'error')
        return redirect(url_for('auth.register_lawyer'))
    
    if not specializations:
        flash('Please select at least one specialization.', 'error')
        return redirect(url_for('auth.register_lawyer'))
    
    # Check if username, email, or license already exists
    if User.query.filter_by(username=username).first():
        flash('Username already exists.', 'error')
        return redirect(url_for('auth.register_lawyer'))
    
    if User.query.filter_by(email=email).first():
        flash('Email already registered.', 'error')
        return redirect(url_for('auth.register_lawyer'))
    
    if LawyerProfile.query.filter_by(license_number=license_number).first():
        flash('License number already registered.', 'error')
        return redirect(url_for('auth.register_lawyer'))
    
    try:
        # Create user
        user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            address=address,
            user_type='lawyer'
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create lawyer profile
        lawyer_profile = LawyerProfile(
            user_id=user.id,
            license_number=license_number,
            years_of_experience=int(years_of_experience),
            education=education,
            bar_association=bar_association,
            hourly_rate=float(hourly_rate) if hourly_rate else None,
            bio=bio,
            certifications=certifications,
            approval_status='pending'
        )
        
        db.session.add(lawyer_profile)
        
        # Add specializations
        services = LegalService.query.filter(LegalService.id.in_(specializations)).all()
        lawyer_profile.specializations.extend(services)
        
        db.session.commit()
        
        # Log activity
        log_activity(user, 'create', description='Lawyer account created - pending approval')
        
        flash('Registration successful! Your account is pending approval from our admin team.', 'success')
        return redirect(url_for('auth.login'))
        
    except Exception as e:
        db.session.rollback()
        flash('Registration failed. Please try again.', 'error')
        return redirect(url_for('auth.register_lawyer'))

@auth_bp.route('/logout')
@login_required
def logout():
    """Handle user logout"""
    # Log the logout activity
    log_activity(current_user, 'logout', description='User logged out')
    
    logout_user()
    flash('You have been logged out successfully.', 'success')
    return redirect(url_for('main.home'))

@auth_bp.route('/select-service/<service_id>')
def select_service(service_id):
    """Store selected service in session and redirect to login/register"""
    service = LegalService.query.get_or_404(service_id)
    session['selected_service'] = service_id
    
    if current_user.is_authenticated:
        if current_user.user_type == 'client':
            return redirect(url_for('case.create', service_id=service_id))
        else:
            flash('Only clients can request legal services.', 'error')
            return redirect(url_for('main.home'))
    
    return redirect(url_for('auth.login'))

@auth_bp.route('/forgot-password')
def forgot_password():
    """Forgot password page"""
    return render_template('auth/forgot_password.html')

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password_post():
    """Handle forgot password form submission"""
    email = request.form.get('email')
    
    if not email:
        flash('Please enter your email address.', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    user = User.query.filter_by(email=email).first()
    
    if user:
        # Here you would typically send a password reset email
        # For now, just show a success message
        flash('If an account with this email exists, a password reset link has been sent.', 'info')
    else:
        # Don't reveal that the email doesn't exist for security
        flash('If an account with this email exists, a password reset link has been sent.', 'info')
    
    return redirect(url_for('auth.login'))

# Helper functions
def redirect_user_to_dashboard():
    """Redirect user to appropriate dashboard based on user type"""
    if current_user.user_type == 'client':
        return redirect(url_for('client.dashboard'))
    elif current_user.user_type == 'lawyer':
        if current_user.lawyer_profile.approval_status == 'approved':
            return redirect(url_for('lawyer.dashboard'))
        else:
            return redirect(url_for('lawyer.pending_approval'))
    elif current_user.user_type == 'admin':
        return redirect(url_for('admin.dashboard'))
    else:
        return redirect(url_for('main.home'))

def log_activity(user, action, model_name=None, object_id=None, description=''):
    """Log user activity"""
    try:
        activity = ActivityLog(
            user_id=user.id,
            action=action,
            model_name=model_name,
            object_id=object_id,
            description=description,
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string
        )
        db.session.add(activity)
        db.session.commit()
    except:
        # Don't let logging failures affect the main operation
        db.session.rollback()