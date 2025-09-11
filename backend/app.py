from flask import Flask, render_template, request, redirect, url_for, flash
from flask_login import LoginManager, current_user
from flask_migrate import Migrate
from flask_mail import Mail
from flask_wtf.csrf import CSRFProtect
import os
from datetime import datetime, timedelta

# Import models and views
from models import db, User, Notification
from views import register_blueprints

def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or 'sqlite:///legal_platform.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_recycle': 300,
        'pool_pre_ping': True
    }
    
    # File upload settings
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
    
    # Mail settings
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER') or 'localhost'
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT') or 587)
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER') or 'noreply@legalplatform.com'
    
    # Pagination settings
    app.config['POSTS_PER_PAGE'] = 10
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    mail = Mail(app)
    csrf = CSRFProtect(app)
    
    # Login Manager setup
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(user_id)
    
    # Register blueprints
    register_blueprints(app)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return render_template('errors/500.html'), 500
    
    @app.errorhandler(403)
    def forbidden_error(error):
        return render_template('errors/403.html'), 403
    
    @app.errorhandler(413)
    def request_entity_too_large(error):
        flash('File too large. Maximum size allowed is 16MB.', 'error')
        return redirect(request.url), 413
    
    # Context processors
    @app.context_processor
    def inject_global_vars():
        """Inject global variables into all templates"""
        unread_notifications = 0
        if current_user.is_authenticated:
            unread_notifications = Notification.query.filter_by(
                recipient_id=current_user.id,
                is_read=False
            ).count()
        
        return {
            'current_year': datetime.utcnow().year,
            'unread_notifications': unread_notifications,
            'app_name': 'Legal Services Platform'
        }
    
    # Template filters
    @app.template_filter('datetime')
    def datetime_filter(dt, format='%Y-%m-%d %H:%M'):
        """Format datetime for templates"""
        if dt is None:
            return ""
        return dt.strftime(format)
    
    @app.template_filter('date')
    def date_filter(dt, format='%Y-%m-%d'):
        """Format date for templates"""
        if dt is None:
            return ""
        return dt.strftime(format)
    
    @app.template_filter('currency')
    def currency_filter(amount):
        """Format currency for templates"""
        if amount is None:
            return "$0.00"
        return f"${amount:,.2f}"
    
    @app.template_filter('time_ago')
    def time_ago_filter(dt):
        """Show time ago format"""
        if dt is None:
            return ""
        
        now = datetime.utcnow()
        diff = now - dt
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days != 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        else:
            return "Just now"
    
    @app.template_filter('truncate_words')
    def truncate_words_filter(text, length=50, suffix='...'):
        """Truncate text by words"""
        if text is None:
            return ""
        words = text.split()
        if len(words) <= length:
            return text
        return ' '.join(words[:length]) + suffix
    
    # CLI commands
    @app.cli.command()
    def init_db():
        """Initialize the database."""
        db.create_all()
        print('Database initialized.')
    
    @app.cli.command()
    def create_admin():
        """Create admin user."""
        from models import User, ActivityLog
        
        username = input('Enter admin username: ')
        email = input('Enter admin email: ')
        password = input('Enter admin password: ')
        first_name = input('Enter first name: ')
        last_name = input('Enter last name: ')
        
        # Check if admin already exists
        if User.query.filter_by(username=username).first():
            print('Username already exists!')
            return
        
        if User.query.filter_by(email=email).first():
            print('Email already exists!')
            return
        
        try:
            admin_user = User(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                user_type='admin',
                is_active=True
            )
            admin_user.set_password(password)
            
            db.session.add(admin_user)
            db.session.commit()
            
            # Log the creation
            activity = ActivityLog(
                user_id=admin_user.id,
                action='create',
                model_name='User',
                object_id=admin_user.id,
                description='Admin user account created via CLI'
            )
            db.session.add(activity)
            db.session.commit()
            
            print(f'Admin user {username} created successfully!')
            
        except Exception as e:
            db.session.rollback()
            print(f'Error creating admin user: {str(e)}')
    
    @app.cli.command()
    def seed_data():
        """Seed the database with initial data."""
        from models import LegalService, SystemSettings
        
        # Create legal services if they don't exist
        services = [
            {
                'name': 'Corporate Law',
                'description': 'Business formation, contracts, mergers and acquisitions',
                'icon': 'building'
            },
            {
                'name': 'Family Law',
                'description': 'Divorce, custody, adoption, domestic relations',
                'icon': 'users'
            },
            {
                'name': 'Criminal Defense',
                'description': 'Criminal charges, DUI, traffic violations',
                'icon': 'shield'
            },
            {
                'name': 'Personal Injury',
                'description': 'Accidents, medical malpractice, wrongful death',
                'icon': 'heart-pulse'
            },
            {
                'name': 'Real Estate Law',
                'description': 'Property transactions, landlord-tenant, zoning',
                'icon': 'home'
            },
            {
                'name': 'Employment Law',
                'description': 'Workplace disputes, discrimination, wrongful termination',
                'icon': 'briefcase'
            },
            {
                'name': 'Immigration Law',
                'description': 'Visas, citizenship, deportation defense',
                'icon': 'passport'
            },
            {
                'name': 'Intellectual Property',
                'description': 'Patents, trademarks, copyrights',
                'icon': 'lightbulb'
            }
        ]
        
        for service_data in services:
            if not LegalService.query.filter_by(name=service_data['name']).first():
                service = LegalService(**service_data)
                db.session.add(service)
        
        # Create default system settings
        default_settings = [
            {
                'key': 'site_name',
                'value': 'Legal Services Platform',
                'description': 'Name of the website'
            },
            {
                'key': 'max_file_size',
                'value': '16777216',  # 16MB in bytes
                'description': 'Maximum file upload size in bytes'
            },
            {
                'key': 'default_tax_rate',
                'value': '0.08',
                'description': 'Default tax rate for invoices (8%)'
            },
            {
                'key': 'admin_email',
                'value': 'admin@legalplatform.com',
                'description': 'Administrator contact email'
            },
            {
                'key': 'lawyer_approval_required',
                'value': 'true',
                'description': 'Whether lawyer accounts require admin approval'
            }
        ]
        
        for setting_data in default_settings:
            if not SystemSettings.query.filter_by(key=setting_data['key']).first():
                setting = SystemSettings(**setting_data)
                db.session.add(setting)
        
        try:
            db.session.commit()
            print('Database seeded with initial data!')
        except Exception as e:
            db.session.rollback()
            print(f'Error seeding database: {str(e)}')
    
    @app.cli.command()
    def cleanup_old_notifications():
        """Clean up old notifications (older than 30 days)."""
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        old_notifications = Notification.query.filter(
            Notification.created_at < cutoff_date,
            Notification.is_read == True
        ).all()
        
        count = len(old_notifications)
        for notification in old_notifications:
            db.session.delete(notification)
        
        try:
            db.session.commit()
            print(f'Cleaned up {count} old notifications.')
        except Exception as e:
            db.session.rollback()
            print(f'Error cleaning up notifications: {str(e)}')
    
    # Before request handlers
    @app.before_request
    def create_upload_folder():
        """Ensure upload folder exists"""
        upload_folder = app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            
        # Create subfolders
        subfolders = ['documents', 'profile_pics']
        for subfolder in subfolders:
            folder_path = os.path.join(upload_folder, subfolder)
            if not os.path.exists(folder_path):
                os.makedirs(folder_path)
    
    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    # Development server settings
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() in ['true', '1', 'on']
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '127.0.0.1')
    
    # Create tables if they don't exist (development only)
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully!")
        except Exception as e:
            print(f"Error creating database tables: {str(e)}")
    
    app.run(host=host, port=port, debug=debug)