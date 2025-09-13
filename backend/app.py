from datetime import timedelta
from flask import Flask, request, jsonify
from flask_login import LoginManager
from models import db, TokenBlocklist, User
from flask_migrate import Migrate
from flask_mail import Mail
from flask_jwt_extended import JWTManager
from flask_cors import CORS

app = Flask(__name__)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///legal_platform.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database and migrations
migrate = Migrate(app, db)
db.init_app(app)

# Flask CORS
CORS(app)

# Secret keys
app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'

# Mail configurations
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config["MAIL_USE_SSL"] = False
app.config['MAIL_USERNAME'] = 'your-email@gmail.com'
app.config['MAIL_PASSWORD'] = 'your-app-password'
app.config['MAIL_DEFAULT_SENDER'] = 'noreply@legalplatform.com'

mail = Mail(app)

# JWT configuration
app.config["JWT_SECRET_KEY"] = "super-secret-jwt-key-change-in-production"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
app.config["JWT_VERIFY_SUB"] = False

jwt = JWTManager(app)
jwt.init_app(app)

# Login Manager setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Please log in to access this page.'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)


# Register Blueprints (updated for consistency)
from views import auth_bp, admin_bp, client_bp, lawyer_bp, main_bp, chat_bp, document_bp, user_bp
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(client_bp)
app.register_blueprint(lawyer_bp)
app.register_blueprint(main_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(document_bp)
app.register_blueprint(user_bp)

# JWT token blocklist callback
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload: dict) -> bool:
    jti = jwt_payload["jti"]
    token = db.session.query(TokenBlocklist.id).filter_by(jti=jti).scalar()
    return token is not None

# CLI command to create admin user
@app.cli.command()
def create_admin():
    """Create admin user."""
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
        
        print(f'Admin user {username} created successfully!')
        
    except Exception as e:
        db.session.rollback()
        print(f'Error creating admin user: {str(e)}')

# CLI command to seed initial data
@app.cli.command()
def seed_data():
    """Seed the database with initial legal services."""
    from models import LegalService
    
    services = [
        {'name': 'Corporate Law', 'description': 'Business formation, contracts, mergers and acquisitions', 'icon': 'building'},
        {'name': 'Family Law', 'description': 'Divorce, custody, adoption, domestic relations', 'icon': 'users'},
        {'name': 'Criminal Defense', 'description': 'Criminal charges, DUI, traffic violations', 'icon': 'shield'},
        {'name': 'Personal Injury', 'description': 'Accidents, medical malpractice, wrongful death', 'icon': 'heart'},
        {'name': 'Real Estate Law', 'description': 'Property transactions, landlord-tenant, zoning', 'icon': 'home'},
        {'name': 'Employment Law', 'description': 'Workplace disputes, discrimination, wrongful termination', 'icon': 'briefcase'},
        {'name': 'Immigration Law', 'description': 'Visas, citizenship, deportation defense', 'icon': 'passport'},
        {'name': 'Intellectual Property', 'description': 'Patents, trademarks, copyrights', 'icon': 'lightbulb'}
    ]
    
    for service_data in services:
        if not LegalService.query.filter_by(name=service_data['name']).first():
            service = LegalService(**service_data)
            db.session.add(service)
    
    try:
        db.session.commit()
        print('Database seeded with legal services!')
    except Exception as e:
        db.session.rollback()
        print(f'Error seeding database: {str(e)}')

if __name__ == "__main__":
    # Create tables if they don't exist
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully!")
        except Exception as e:
            print(f"Error creating database tables: {str(e)}")
    
    app.run(debug=True)