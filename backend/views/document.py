from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_login import login_required, current_user
from models import db, Case, Document
from werkzeug.utils import secure_filename
import os
from datetime import datetime

document_bp = Blueprint('document', __name__, url_prefix='/document')

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@document_bp.route('/upload/<case_id>')
@login_required
def upload_form(case_id):
    """Document upload form"""
    case = Case.query.get_or_404(case_id)
    
    # Check permissions
    if current_user.user_type == 'client' and case.client_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    elif current_user.user_type == 'lawyer' and case.lawyer_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    elif current_user.user_type not in ['client', 'lawyer', 'admin']:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    
    return render_template('document/upload.html', case=case)

@document_bp.route('/upload/<case_id>', methods=['POST'])
@login_required
def upload_post(case_id):
    """Handle document upload"""
    case = Case.query.get_or_404(case_id)
    
    # Check permissions
    if current_user.user_type == 'client' and case.client_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    elif current_user.user_type == 'lawyer' and case.lawyer_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    
    if 'file' not in request.files:
        flash('No file selected.', 'error')
        return redirect(url_for('document.upload_form', case_id=case_id))
    
    file = request.files['file']
    if file.filename == '':
        flash('No file selected.', 'error')
        return redirect(url_for('document.upload_form', case_id=case_id))
    
    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            # Create unique filename
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_')
            filename = timestamp + filename
            
            # Create upload directory if it doesn't exist
            upload_folder = os.path.join('uploads', 'documents')
            os.makedirs(upload_folder, exist_ok=True)
            
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            
            # Save to database
            document = Document(
                case_id=case_id,
                uploaded_by_id=current_user.id,
                title=request.get_json().get('title'),
                document_type=request.get_json().get('document_type'),
                file_path=file_path,
                description=request.get_json().get('description'),
                is_confidential=bool(request.get_json().get('is_confidential'))
            )
            
            db.session.add(document)
            db.session.commit()
            
            flash('Document uploaded successfully!', 'success')
            return redirect(url_for('case.detail', case_id=case_id))
            
        except Exception as e:
            db.session.rollback()
            flash('Error uploading document. Please try again.', 'error')
            return redirect(url_for('document.upload_form', case_id=case_id))
    else:
        flash('File type not allowed.', 'error')
        return redirect(url_for('document.upload_form', case_id=case_id))

@document_bp.route('/download/<document_id>')
@login_required
def download(document_id):
    """Download a document"""
    document = Document.query.get_or_404(document_id)
    case = document.case
    
    # Check permissions
    if current_user.user_type == 'client' and case.client_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    elif current_user.user_type == 'lawyer' and case.lawyer_id != current_user.id:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    elif current_user.user_type not in ['client', 'lawyer', 'admin']:
        flash('Access denied.', 'error')
        return redirect(url_for('main.home'))
    
    try:
        return send_file(document.file_path, as_attachment=True)
    except FileNotFoundError:
        flash('File not found.', 'error')
        return redirect(url_for('case.detail', case_id=case.id))

@document_bp.route("/", methods=["GET"])
def get_documents():
    case_id = request.args.get("case_id")
    query = Document.query
    if case_id:
        query = query.filter_by(case_id=case_id)
    documents = query.all()
    return jsonify([{
        "id": d.id,
        "case_id": d.case_id,
        "name": d.name,
        "document_type": d.document_type,
        "created_at": d.created_at
    } for d in documents]), 200

@document_bp.route("/documents", methods=["POST"])
def upload_document():
    data = request.get_json()
    doc = Document(
        case_id=data.get("case_id"),
        name=data.get("name"),
        document_type=data.get("document_type")
    )
    db.session.add(doc)
    db.session.commit()
    return jsonify({"success": "Document uploaded", "id": doc.id}), 201