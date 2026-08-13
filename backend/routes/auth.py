from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

auth_bp = Blueprint('auth', __name__, url_prefix='/api')

def is_valid_user_id(user_id):
    if not isinstance(user_id, str):
        return False
    if len(user_id) < 4 or len(user_id) > 20:
        return False
    return bool(__import__('re').match(r'^[A-Za-z0-9_]+$', user_id))

def is_valid_password(password):
    if not isinstance(password, str):
        return False
    if len(password) < 8 or len(password) > 32:
        return False
    if any(ch.isspace() for ch in password):
        return False
    categories = [any(ch.islower() for ch in password), any(ch.isupper() for ch in password), any(ch.isdigit() for ch in password), any(not ch.isalnum() for ch in password)]
    return sum(categories) >= 2

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    password = data.get('password')
    student_id = data.get('student_id')
    department = data.get('department')
    target_gpa = data.get('target_gpa', 4.5)

    if not user_id or not password or not student_id or not department:
        return jsonify({'success': False, 'message': '모든 필수 정보를 입력해 주세요.'}), 400

    if not is_valid_user_id(user_id):
        return jsonify({'success': False, 'message': '아이디는 4~20자, 영문/숫자/밑줄(_)만 사용 가능합니다.'}), 400

    if not is_valid_password(password):
        return jsonify({'success': False, 'message': '비밀번호는 8~32자이며, 영문/숫자/특수문자 중 2종류 이상을 포함해야 합니다.'}), 400

    if not student_id.isdigit() or len(student_id) < 8 or len(student_id) > 20:
        return jsonify({'success': False, 'message': '학번은 숫자 8~20자리여야 합니다.'}), 400

    if User.query.filter_by(user_id=user_id).first():
        return jsonify({'success': False, 'message': '이미 존재하는 아이디입니다.'}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(
        user_id=user_id,
        password=hashed_password,
        student_id=student_id,
        department=department,
        target_gpa=target_gpa
    )
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'success': True, 'message': '회원가입이 완료되었습니다!'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    password = data.get('password')

    if not user_id or not password:
        return jsonify({'success': False, 'message': '아이디와 비밀번호를 모두 입력해 주세요.'}), 400

    user = User.query.filter_by(user_id=user_id).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({'success': False, 'message': '아이디 또는 비밀번호가 올바르지 않습니다.'}), 401

    session.permanent = True
    session['user_id'] = user.user_id
    session['department'] = user.department

    return jsonify({
        'success': True,
        'message': '로그인 성공!',
        'user': {
            'user_id': user.user_id,
            'student_id': user.student_id,
            'department': user.department,
            'target_gpa': user.target_gpa
        }
    }), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': '로그아웃 되었습니다.'}), 200

@auth_bp.route('/user/me', methods=['GET'])
def get_me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False}), 401
    
    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        session.clear()
        return jsonify({'authenticated': False}), 401

    return jsonify({
        'authenticated': True,
        'user': {
            'user_id': user.user_id,
            'student_id': user.student_id,
            'department': user.department,
            'target_gpa': user.target_gpa
        }
    }), 200