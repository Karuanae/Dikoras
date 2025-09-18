from flask import Blueprint, request, jsonify
from models import db, User, 
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, get_jwt
import datetime

import logging