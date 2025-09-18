# views/auth_views.py
from flask import Blueprint, request, jsonify
from models import db, EmailOTP
from flask_jwt_extended import jwt_required
import logging


from views import (
    admin, 
    case, 
    chat,
    client, 
    invoice,
    lawyer,
    notification,
    transaction,
    user
)

# Blueprints
admin_bp = Blueprint('admin', __name__)
case_bp = Blueprint('case', __name__)
chat_bp = Blueprint('chat', __name__)
client_bp = Blueprint('client', __name__)
invoice_bp = Blueprint('invoice', __name__)
lawyer_bp = Blueprint('lawyer', __name__)
notification_bp = Blueprint('notification', __name__)
transaction_bp = Blueprint('transaction', __name__)
user_bp = Blueprint('user', __name__)

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)


#  Error Handlers 
@auth_bp.errorhandler(400)
def bad_request(error):
    return jsonify({"message": "Bad request"}), 400

@auth_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({"message": "Unauthorized"}), 401

@auth_bp.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({"message": "Internal server error"}), 500


@admin_bp.route('/api/v1/admin', methods=['POST'])
@jwt_required()
def change_password_view():
    return admin.admin()

@case_bp.route('/api/v1/case', methods=['POST'])
@jwt_required()
def deactivate_view():
    return case.case()

@chat_bp.route('/api/v1/chat', methods=['POST'])
@jwt_required()
def deactivate_view():
    return chat.chat()

@client_bp.route('/api/v1/client', methods=['POST'])
@jwt_required()
def deactivate_view():
    return client.client()

@invoice_bp.route('/api/v1/invoice', methods=['POST'])
@jwt_required()
def deactivate_view():
    return invoice.invoice()

@lawyer_bp.route('/api/v1/lawyer', methods=['POST'])
@jwt_required()
def deactivate_view():
    return lawyer.lawyer()

@notification_bp.route('/api/v1/notification', methods=['POST'])
@jwt_required()
def deactivate_view():
    return notification.notification()

@transaction_bp.route('/api/v1/transaction', methods=['POST'])
@jwt_required()
def deactivate_view():
    return transaction.transaction()

@user_bp.route('/api/v1/user', methods=['POST'])
@jwt_required()
def deactivate_view():
    return user.user()


