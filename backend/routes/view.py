from flask import Blueprint, render_template, redirect, session
from models import User

view_bp = Blueprint('view', __name__)

def is_authenticated():
    user_id = session.get('user_id')
    if not user_id:
        return False
    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        session.clear()
        return False
    return True

@view_bp.route('/')
def home():
    return render_template('index.html')

@view_bp.route('/login')
def login_page():
    return render_template('login.html')

@view_bp.route('/register')
def register_page():
    return render_template('register.html')

@view_bp.route('/simulator')
def simulator():
    return render_template('simulator.html')

@view_bp.route('/mode-select')
def mode_select():
    return redirect('/simulator')

@view_bp.route('/dashboard')
def dashboard():
    if not is_authenticated():
        return redirect('/login')
    return render_template('dashboard.html')

@view_bp.route('/mypage')
def mypage(): 
    if not is_authenticated():
        return redirect('/login')
    return render_template('mypage.html')

@view_bp.route('/graduation')
def graduation():
    if not is_authenticated():
        return redirect('/login')
    return render_template('graduation.html')