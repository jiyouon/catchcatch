import os
from datetime import timedelta
from flask import Flask
from models import db
from routes.auth import auth_bp
from routes.graduation import graduation_bp
from routes.schedule import schedule_bp
from routes.view import view_bp

base_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.join(base_dir, '..')

template_dir = os.path.join(project_root, 'frontend', 'templates')
static_dir = os.path.join(project_root, 'frontend', 'static')

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

# DB 및 설정
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(base_dir, 'instance', 'catch_class.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'catchcatch-secret-key-2026'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

db.init_app(app)

# 💡 분리한 라우터들을 각각 등록
app.register_blueprint(auth_bp)
app.register_blueprint(graduation_bp)
app.register_blueprint(schedule_bp)
app.register_blueprint(view_bp)

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)