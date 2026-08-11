from flask import Blueprint, render_template, redirect, session

view_bp = Blueprint('view', __name__)

@view_bp.route('/')
def home():
    return render_template('index.html')

@view_bp.route('/login')
def login_page():
    return render_template('login.html')

@view_bp.route('/register')
def register_page():
    return render_template('register.html')

@view_bp.route('/mode-select')
def mode_select():
    return render_template('mode_select.html')

@view_bp.route('/simulator')
def simulator():
    return render_template('simulator.html')

@view_bp.route('/dashboard')
def dashboard():
    if not session.get('user_id'):
        return redirect('/login')
    return render_template('dashboard.html')

@view_bp.route('/mypage')
def mypage(): 
    if not session.get('user_id'):
        return redirect('/login')
    return render_template('mypage.html')

# <새로 작성> 졸업요건 계산기/판독 페이지 접근 라우트
@view_bp.route('/graduation')
def graduation():
    if not session.get('user_id'):
        return redirect('/login')
    return render_template('graduation.html')