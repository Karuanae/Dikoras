from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime, date
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import MetaData, CheckConstraint
import random
import string

metadata = MetaData()
db = SQLAlchemy(metadata=metadata)

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    user_type = db.Column(db.String(20), nullable=False)  # 'client', 'lawyer', 'admin'
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Lawyer-specific fields (nullable for clients/admins)
    years_of_experience = db.Column(db.Integer)
    education = db.Column(db.Text)
    approval_status = db.Column(db.String(20), nullable=False)  # 'pending', 'approved', 'rejected'
    hourly_rate = db.Column(db.Numeric(10, 2))
    bio = db.Column(db.Text)
    specializations = db.Column(db.String(500))  # Store as comma-separated IDs
    
    def __init__(self, **kwargs):
        # Set approval_status based on business logic if not explicitly provided
        if 'approval_status' not in kwargs and 'user_type' in kwargs:
            kwargs['approval_status'] = 'pending' if kwargs['user_type'] == 'lawyer' else 'approved'
        elif 'approval_status' not in kwargs:
            # Fallback default if user_type is also not provided
            kwargs['approval_status'] = 'pending'
        
        super(User, self).__init__(**kwargs)
    
    # Add constraints for data integrity
    __table_args__ = (
        CheckConstraint(
            "user_type IN ('client', 'lawyer', 'admin')",
            name='valid_user_type'
        ),
        CheckConstraint(
            "approval_status IN ('pending', 'approved', 'rejected')",
            name='valid_approval_status'
        ),
    )
    
    # Relationships
    client_cases = db.relationship('Case', foreign_keys='Case.client_id', backref='client')
    lawyer_cases = db.relationship('Case', foreign_keys='Case.lawyer_id', backref='lawyer')
    chats = db.relationship('Chat', backref='sender')
    notifications = db.relationship('Notification', backref='recipient')
    documents = db.relationship('Document', backref='uploaded_by')
    transactions_as_client = db.relationship('Transaction', foreign_keys='Transaction.client_id', backref='client')
    transactions_as_lawyer = db.relationship('Transaction', foreign_keys='Transaction.lawyer_id', backref='lawyer')
    invoices_as_client = db.relationship('Invoice', foreign_keys='Invoice.client_id', backref='client')
    invoices_as_lawyer = db.relationship('Invoice', foreign_keys='Invoice.lawyer_id', backref='lawyer')
    lawyer_requests = db.relationship('LawyerRequest', backref='lawyer')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f"<User {self.username} ({self.user_type})>"

class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'
    
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False)

class LegalService(db.Model):
    __tablename__ = 'legal_services'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    cases = db.relationship('Case', backref='legal_service')
    
    def __repr__(self):
        return f"<LegalService {self.name}>"

class Case(db.Model):
    __tablename__ = 'cases'
    
    id = db.Column(db.Integer, primary_key=True)
    case_number = db.Column(db.String(50), unique=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lawyer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    legal_service_id = db.Column(db.Integer, db.ForeignKey('legal_services.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='medium')  # 'low', 'medium', 'high', 'urgent'
    status = db.Column(db.String(20), default='open')  # 'open', 'assigned', 'in_progress', 'resolved', 'closed'
    budget = db.Column(db.Numeric(10, 2))
    deadline = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    assigned_at = db.Column(db.DateTime)
    resolved_at = db.Column(db.DateTime)
    
    # Add constraints for case priority and status
    __table_args__ = (
        CheckConstraint(
            "priority IN ('low', 'medium', 'high', 'urgent')",
            name='valid_case_priority'
        ),
        CheckConstraint(
            "status IN ('open', 'assigned', 'in_progress', 'resolved', 'closed')",
            name='valid_case_status'
        ),
    )
    
    # Relationships
    lawyer_requests = db.relationship('LawyerRequest', backref='case', cascade='all, delete-orphan')
    chats = db.relationship('Chat', backref='case', cascade='all, delete-orphan')
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

class LawyerRequest(db.Model):
    __tablename__ = 'lawyer_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey('cases.id'), nullable=False)
    lawyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text)
    proposed_fee = db.Column(db.Numeric(10, 2))
    status = db.Column(db.String(20), default='pending')  # 'pending', 'accepted', 'rejected'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    responded_at = db.Column(db.DateTime)
    
    # Add constraint for lawyer request status
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'accepted', 'rejected')",
            name='valid_lawyer_request_status'
        ),
    )
    
    def __repr__(self):
        return f"<LawyerRequest by {self.lawyer.get_full_name()} for {self.case.case_number}>"


class Chat(db.Model):
    __tablename__ = 'chats'
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey('cases.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    attachment = db.Column(db.String(255))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Chat from {self.sender.get_full_name()} in {self.case.case_number}>"

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey('cases.id'), nullable=False)
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    document_type = db.Column(db.String(50), nullable=False)  # 'contract', 'evidence', 'legal_document', etc.
    file_path = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    is_confidential = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Document {self.title} - {self.case.case_number}>"

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    transaction_number = db.Column(db.String(50), unique=True)
    case_id = db.Column(db.Integer, db.ForeignKey('cases.id'), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lawyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    transaction_type = db.Column(db.String(50), nullable=False)  # 'payment', 'refund', 'fee'
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'completed', 'failed'
    description = db.Column(db.Text)
    payment_method = db.Column(db.String(50))
    payment_reference = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Add constraints for transaction type and status
    __table_args__ = (
        CheckConstraint(
            "transaction_type IN ('payment', 'refund', 'fee')",
            name='valid_transaction_type'
        ),
        CheckConstraint(
            "status IN ('pending', 'completed', 'failed')",
            name='valid_transaction_status'
        ),
    )
    
    def __init__(self, **kwargs):
        super(Transaction, self).__init__(**kwargs)
        if not self.transaction_number:
            self.transaction_number = self.generate_transaction_number()
    
    def generate_transaction_number(self):
        return f"TXN-{datetime.utcnow().strftime('%Y%m%d')}-{''.join(random.choices(string.digits, k=6))}"
    
    def __repr__(self):
        return f"<Transaction {self.transaction_number}: {self.transaction_type} - ${self.amount}>"

class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True)
    case_id = db.Column(db.Integer, db.ForeignKey('cases.id'), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lawyer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    tax_amount = db.Column(db.Numeric(10, 2), default=0)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='draft')  # 'draft', 'sent', 'paid', 'overdue'
    issue_date = db.Column(db.Date, default=date.today)
    due_date = db.Column(db.Date, nullable=False)
    paid_date = db.Column(db.Date)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'))
    
    # Add constraint for invoice status
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'sent', 'paid', 'overdue')",
            name='valid_invoice_status'
        ),
    )
    
    # Relationship
    transaction = db.relationship('Transaction', backref='invoice', uselist=False)
    
    def __init__(self, **kwargs):
        super(Invoice, self).__init__(**kwargs)
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        # Calculate total amount
        if hasattr(self, 'amount') and hasattr(self, 'tax_amount'):
            self.total_amount = self.amount + (self.tax_amount or 0)
    
    def generate_invoice_number(self):
        return f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{''.join(random.choices(string.digits, k=4))}"
    
    def __repr__(self):
        return f"<Invoice {self.invoice_number}: ${self.total_amount}>"

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)  # 'case_request', 'case_accepted', etc.
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    related_case_id = db.Column(db.Integer, db.ForeignKey('cases.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Notification for {self.recipient.get_full_name()}: {self.title}>"

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # 'create', 'update', 'delete', 'login', 'logout'
    description = db.Column(db.Text, nullable=False)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Add constraint for action types
    __table_args__ = (
        CheckConstraint(
            "action IN ('create', 'update', 'delete', 'login', 'logout')",
            name='valid_activity_action'
        ),
    )
    
    # Relationship
    user = db.relationship('User', backref='activity_logs')
    
    def __repr__(self):
        return f"<ActivityLog {self.user.get_full_name()} {self.action} at {self.created_at}>"