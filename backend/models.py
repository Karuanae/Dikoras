from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime, date
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
import random
import string

db = SQLAlchemy()

# Association tables for many-to-many relationships
lawyer_specializations = db.Table('lawyer_specializations',
    db.Column('lawyer_id', db.String(36), db.ForeignKey('lawyer_profile.id'), primary_key=True),
    db.Column('service_id', db.String(36), db.ForeignKey('legal_service.id'), primary_key=True)
)

client_preferred_services = db.Table('client_preferred_services',
    db.Column('client_id', db.String(36), db.ForeignKey('client_profile.id'), primary_key=True),
    db.Column('service_id', db.String(36), db.ForeignKey('legal_service.id'), primary_key=True)
)

# Custom User Model
class User(db.Model, UserMixin):
    __tablename__ = 'user'
    
    USER_TYPES = [
        ('client', 'Client'),
        ('lawyer', 'Lawyer'),
        ('admin', 'Admin'),
    ]
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    user_type = db.Column(db.Enum(*[choice[0] for choice in USER_TYPES], name='user_types'), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    profile_picture = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    client_profile = db.relationship('ClientProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    lawyer_profile = db.relationship('LawyerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    client_cases = db.relationship('Case', foreign_keys='Case.client_id', backref='client')
    lawyer_cases = db.relationship('Case', foreign_keys='Case.lawyer_id', backref='lawyer')
    sent_messages = db.relationship('ChatMessage', backref='sender')
    notifications = db.relationship('Notification', backref='recipient')
    uploaded_documents = db.relationship('Document', backref='uploaded_by')
    client_transactions = db.relationship('Transaction', foreign_keys='Transaction.client_id', backref='client')
    lawyer_transactions = db.relationship('Transaction', foreign_keys='Transaction.lawyer_id', backref='lawyer')
    client_invoices = db.relationship('Invoice', foreign_keys='Invoice.client_id', backref='client')
    lawyer_invoices = db.relationship('Invoice', foreign_keys='Invoice.lawyer_id', backref='lawyer')
    case_requests = db.relationship('LawyerRequest', backref='lawyer')
    activity_logs = db.relationship('ActivityLog', backref='user')
    approved_lawyers = db.relationship('LawyerProfile', foreign_keys='LawyerProfile.approved_by_id', backref='approved_by')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<User {self.username} ({self.user_type})>"

# Legal Service Categories
class LegalService(db.Model):
    __tablename__ = 'legal_service'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(50))  # For frontend icons
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    cases = db.relationship('Case', backref='legal_service')
    
    def __repr__(self):
        return f"<LegalService {self.name}>"

# Client Profile
class ClientProfile(db.Model):
    __tablename__ = 'client_profile'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    company_name = db.Column(db.String(200))
    date_of_birth = db.Column(db.Date)
    national_id = db.Column(db.String(50))
    
    # Relationships
    preferred_services = db.relationship('LegalService', secondary=client_preferred_services, backref='preferred_by_clients')
    
    def __repr__(self):
        return f"<ClientProfile {self.user.get_full_name()}>"

# Lawyer Profile
class LawyerProfile(db.Model):
    __tablename__ = 'lawyer_profile'
    
    APPROVAL_STATUS = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    license_number = db.Column(db.String(100), unique=True, nullable=False)
    years_of_experience = db.Column(db.Integer, nullable=False)
    education = db.Column(db.Text, nullable=False)
    certifications = db.Column(db.Text)
    bar_association = db.Column(db.String(200), nullable=False)
    approval_status = db.Column(db.Enum(*[choice[0] for choice in APPROVAL_STATUS], name='approval_status'), default='pending')
    approved_by_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    approved_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    hourly_rate = db.Column(db.Numeric(10, 2))
    bio = db.Column(db.Text)
    
    # Relationships
    specializations = db.relationship('LegalService', secondary=lawyer_specializations, backref='specialized_lawyers')
    
    def __repr__(self):
        return f"<LawyerProfile {self.user.get_full_name()} ({self.approval_status})>"

# Legal Cases
class Case(db.Model):
    __tablename__ = 'case'
    
    CASE_STATUS = [
        ('open', 'Open'),
        ('assigned', 'Assigned to Lawyer'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number = db.Column(db.String(50), unique=True)
    client_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    lawyer_id = db.Column(db.String(36), db.ForeignKey('user.id'))
    legal_service_id = db.Column(db.String(36), db.ForeignKey('legal_service.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.Enum(*[choice[0] for choice in PRIORITY_LEVELS], name='priority_levels'), default='medium')
    status = db.Column(db.Enum(*[choice[0] for choice in CASE_STATUS], name='case_status'), default='open')
    budget = db.Column(db.Numeric(10, 2))
    deadline = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    assigned_at = db.Column(db.DateTime)
    resolved_at = db.Column(db.DateTime)
    
    # Relationships
    lawyer_requests = db.relationship('LawyerRequest', backref='case', cascade='all, delete-orphan')
    messages = db.relationship('ChatMessage', backref='case', cascade='all, delete-orphan')
    documents = db.relationship('Document', backref='case', cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', backref='case', cascade='all, delete-orphan')
    invoices = db.relationship('Invoice', backref='case', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='related_case')
    
    def __init__(self, **kwargs):
        super(Case, self).__init__(**kwargs)
        if not self.case_number:
            self.case_number = self.generate_case_number()
    
    def generate_case_number(self):
        return f"CASE-{datetime.utcnow().strftime('%Y%m%d')}-{''.join(random.choices(string.digits, k=4))}"
    
    def __repr__(self):
        return f"<Case {self.case_number}: {self.title}>"

# Lawyer Requests to Handle Cases
class LawyerRequest(db.Model):
    __tablename__ = 'lawyer_request'
    
    REQUEST_STATUS = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = db.Column(db.String(36), db.ForeignKey('case.id'), nullable=False)
    lawyer_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text)
    proposed_fee = db.Column(db.Numeric(10, 2))
    status = db.Column(db.Enum(*[choice[0] for choice in REQUEST_STATUS], name='request_status'), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    responded_at = db.Column(db.DateTime)
    
    __table_args__ = (db.UniqueConstraint('case_id', 'lawyer_id', name='unique_case_lawyer_request'),)
    
    def __repr__(self):
        return f"<LawyerRequest by {self.lawyer.get_full_name()} for {self.case.case_number}>"

# Chat Messages
class ChatMessage(db.Model):
    __tablename__ = 'chat_message'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = db.Column(db.String(36), db.ForeignKey('case.id'), nullable=False)
    sender_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    attachment = db.Column(db.String(255))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<ChatMessage from {self.sender.get_full_name()} in {self.case.case_number}>"

# Documents Storage
class Document(db.Model):
    __tablename__ = 'document'
    
    DOCUMENT_TYPES = [
        ('contract', 'Contract'),
        ('case_file', 'Case File'),
        ('evidence', 'Evidence'),
        ('legal_document', 'Legal Document'),
        ('invoice', 'Invoice'),
        ('receipt', 'Receipt'),
        ('other', 'Other'),
    ]
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = db.Column(db.String(36), db.ForeignKey('case.id'), nullable=False)
    uploaded_by_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    document_type = db.Column(db.Enum(*[choice[0] for choice in DOCUMENT_TYPES], name='document_types'), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    is_confidential = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Document {self.title} - {self.case.case_number}>"

# Transactions
class Transaction(db.Model):
    __tablename__ = 'transaction'
    
    TRANSACTION_TYPES = [
        ('payment', 'Payment'),
        ('refund', 'Refund'),
        ('fee', 'Legal Fee'),
        ('consultation', 'Consultation Fee'),
    ]
    
    TRANSACTION_STATUS = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_number = db.Column(db.String(50), unique=True)
    case_id = db.Column(db.String(36), db.ForeignKey('case.id'), nullable=False)
    client_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    lawyer_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    transaction_type = db.Column(db.Enum(*[choice[0] for choice in TRANSACTION_TYPES], name='transaction_types'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.Enum(*[choice[0] for choice in TRANSACTION_STATUS], name='transaction_status'), default='pending')
    description = db.Column(db.Text)
    payment_method = db.Column(db.String(50))
    payment_reference = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    invoice = db.relationship('Invoice', backref='transaction', uselist=False)
    
    def __init__(self, **kwargs):
        super(Transaction, self).__init__(**kwargs)
        if not self.transaction_number:
            self.transaction_number = self.generate_transaction_number()
    
    def generate_transaction_number(self):
        return f"TXN-{datetime.utcnow().strftime('%Y%m%d')}-{''.join(random.choices(string.digits, k=6))}"
    
    def __repr__(self):
        return f"<Transaction {self.transaction_number}: {self.transaction_type} - ${self.amount}>"

# Invoices
class Invoice(db.Model):
    __tablename__ = 'invoice'
    
    INVOICE_STATUS = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_number = db.Column(db.String(50), unique=True)
    case_id = db.Column(db.String(36), db.ForeignKey('case.id'), nullable=False)
    client_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    lawyer_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    tax_amount = db.Column(db.Numeric(10, 2), default=0)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum(*[choice[0] for choice in INVOICE_STATUS], name='invoice_status'), default='draft')
    issue_date = db.Column(db.Date, default=date.today)
    due_date = db.Column(db.Date, nullable=False)
    paid_date = db.Column(db.Date)
    transaction_id = db.Column(db.String(36), db.ForeignKey('transaction.id'))
    
    def __init__(self, **kwargs):
        super(Invoice, self).__init__(**kwargs)
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        # Calculate total amount
        self.total_amount = self.amount + (self.tax_amount or 0)
    
    def generate_invoice_number(self):
        return f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{''.join(random.choices(string.digits, k=4))}"
    
    def __repr__(self):
        return f"<Invoice {self.invoice_number}: ${self.total_amount}>"

# Notifications
class Notification(db.Model):
    __tablename__ = 'notification'
    
    NOTIFICATION_TYPES = [
        ('case_request', 'Case Request'),
        ('case_accepted', 'Case Accepted'),
        ('case_rejected', 'Case Rejected'),
        ('new_message', 'New Message'),
        ('payment_received', 'Payment Received'),
        ('invoice_generated', 'Invoice Generated'),
        ('lawyer_approved', 'Lawyer Approved'),
        ('case_status_update', 'Case Status Update'),
        ('system', 'System Notification'),
    ]
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recipient_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    notification_type = db.Column(db.Enum(*[choice[0] for choice in NOTIFICATION_TYPES], name='notification_types'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    related_case_id = db.Column(db.String(36), db.ForeignKey('case.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Notification for {self.recipient.get_full_name()}: {self.title}>"

# System Settings (for admin)
class SystemSettings(db.Model):
    __tablename__ = 'system_settings'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<SystemSettings {self.key}: {self.value}>"

# Activity Log (for tracking admin activities)
class ActivityLog(db.Model):
    __tablename__ = 'activity_log'
    
    ACTION_TYPES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('login', 'Login'),
        ('logout', 'Logout'),
    ]
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.Enum(*[choice[0] for choice in ACTION_TYPES], name='action_types'), nullable=False)
    model_name = db.Column(db.String(100))
    object_id = db.Column(db.String(100))
    description = db.Column(db.Text, nullable=False)
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<ActivityLog {self.user.get_full_name()} {self.action} at {self.created_at}>"