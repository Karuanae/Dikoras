from datetime import timedelta
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_login import LoginManager
from models import db, TokenBlocklist, User
from flask_migrate import Migrate
from flask_mail import Mail
from flask_jwt_extended import JWTManager
from flask_cors import CORS

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///legal_platform.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database and migrations
migrate = Migrate(app, db)
db.init_app(app)




# Secret keys
app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'

# Mail configurations
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config["MAIL_USE_SSL"] = False
app.config['MAIL_USERNAME'] = 'thee.manase@gmail.com'
app.config['MAIL_PASSWORD'] = 'tpct fyni fwzb rsmv'
app.config['MAIL_DEFAULT_SENDER'] = 'thee.manase@gmail.com'

mail = Mail(app)

# JWT configuration
app.config["JWT_SECRET_KEY"] = "fkmvkfksopsdpakcmvdmskasppwx"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
app.config["JWT_VERIFY_SUB"] = False

jwt = JWTManager(app)
jwt.init_app(app)

# Login Manager setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth_bp.login'
login_manager.login_message = 'Please log in to access this page.'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)

from views.auth import auth_bp
from views.admin import admin_bp
from views.client import client_bp
from views.lawyer import lawyer_bp
from views.main import main_bp
from views.chat import chat_bp
from views.document import document_bp
from views.user import user_bp
from views.case import case_bp
from views.invoice import invoice_bp
from views.transaction import transaction_bp
from views.notification import notification_bp


app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(admin_bp, url_prefix='/admin')
app.register_blueprint(client_bp, url_prefix='/client')
app.register_blueprint(lawyer_bp, url_prefix='/lawyer')
app.register_blueprint(main_bp, url_prefix='/main')
app.register_blueprint(chat_bp, url_prefix='/chat')
app.register_blueprint(document_bp, url_prefix='/document')
app.register_blueprint(user_bp, url_prefix='/user')
app.register_blueprint(case_bp, url_prefix='/case')
app.register_blueprint(invoice_bp, url_prefix='/invoice')
app.register_blueprint(transaction_bp, url_prefix='/transaction')
app.register_blueprint(notification_bp, url_prefix='/notification')

# Move CORS initialization here, after blueprints
CORS(app, 
     origins=[
         "http://localhost:5173",    # Vite dev server (localhost)
         "http://127.0.0.1:5173",    # Vite dev server (127.0.0.1)
         "http://localhost:3000",    # React dev server
         "http://127.0.0.1:3000",    # React dev server (alternative)
     ],
     methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
     allow_headers=[
         "Content-Type", 
         "Authorization", 
         "X-Requested-With",
         "Accept",
         "Origin"
     ],
     supports_credentials=True,
     expose_headers=["Content-Type", "Authorization"]
)

# SocketIO event for typing indicator
@socketio.on('typing')
def handle_typing(data):
    room = data.get('room')
    user = data.get('user')
    socketio.emit('typing', {'user': user}, room=room)

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
    # Use socketio.run instead of app.run
    socketio.run(app, debug=True)