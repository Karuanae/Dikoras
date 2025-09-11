from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from models import db
from views import register_blueprints
import os

app = Flask(__name__)

# Configurations
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///dikoras.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'supersecretkey')

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)

# Register blueprints
register_blueprints(app)

@app.route('/')
def index():
    return {'message': 'Dikoras Backend API'}

if __name__ == '__main__':
    app.run(debug=True)
