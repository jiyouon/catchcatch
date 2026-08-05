from flask import Flask, request, jsonify, session, render_template
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Course, GraduationRequirement

app = Flask(__name__)

# 1. Flask & DB 연결 설정 (통합 DB 파일: catch_class.db)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///catch_class.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'catchcatch-secret-key-2026' # 세션 암호화 키

db.init_app(app)

with app.app_context():
    db.create_all()

# [API] 회원가입
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    user_id = data.get('user_id')
    password = data.get('password')
    student_id = data.get('student_id')
    department = data.get('department')
    target_gpa = data.get('target_gpa', 4.5)

    if not user_id or not password or not student_id or not department:
        return jsonify({'success': False, 'message': '모든 필수 정보를 입력해 주세요.'}), 400
    
    if len(password) < 8:
        return jsonify({'success': False, 'message': '비밀번호는 8자리 이상이어야 합니다.'}), 400

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


# [API] 로그인
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user_id = data.get('user_id')
    password = data.get('password')

    user = User.query.filter_by(user_id=user_id).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({'success': False, 'message': '아이디 또는 비밀번호가 올바르지 않습니다.'}), 401

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


# [API] 로그아웃
@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': '로그아웃 되었습니다.'}), 200


# [API] 내 정보 조회
@app.route('/api/user/me', methods=['GET'])
def get_me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False}), 401
    
    user = User.query.filter_by(user_id=user_id).first()
    return jsonify({
        'authenticated': True,
        'user': {
            'user_id': user.user_id,
            'student_id': user.student_id,
            'department': user.department,
            'target_gpa': user.target_gpa
        }
    }), 200



# 졸업요건 가져오기!
@app.route('/api/graduation-check', methods=['GET'])
def check_graduation():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    user = User.query.filter_by(user_id=user_id).first()
    
    # 내 학과의 졸업요건 가져오기 (입학년도 2026 기준)
    entry_year = int(user.student_id[:4]) if len(user.student_id) >= 4 else 2026
    req = GraduationRequirement.query.filter_by(
        department=user.department,
        entry_year=entry_year
    ).first()

    if not req:
        # 혹시 DB에 지정 학과가 없을 경우 컴공/일반학과 기준 기본값 세팅
        req = GraduationRequirement(
            department=user.department,
            entry_year=2026,
            req_general_total=33,
            req_major_total=42,
            req_total_credits=130
        )

    # 유저 수강 과목 (추후 수강 과목 테이블 연동)
    user_courses = []

    total_credits = sum(c.credits for c in user_courses)
    major_credits = sum(c.credits for c in user_courses if '전공' in str(c.category))
    general_credits = sum(c.credits for c in user_courses if '교양' in str(c.category))

    sw_taken = any(c.title == req.req_sw_name or 'SW문해' in str(c.category) for c in user_courses)
    core_domains_taken = set(c.domain for c in user_courses if '핵심교양' in str(c.category) and c.domain)

    warnings = []
    if total_credits < req.req_total_credits:
        warnings.append(f"총 학점이 {req.req_total_credits - total_credits}학점 부족합니다.")
    if general_credits < req.req_general_total:
        warnings.append(f"교양 학점이 {req.req_general_total - general_credits}학점 부족합니다.")
    if major_credits < req.req_major_total:
        warnings.append(f"주전공 학점이 {req.req_major_total - major_credits}학점 부족합니다.")
    
    if req.req_sw_name and req.req_sw_credits > 0 and not sw_taken:
        warnings.append(f"필수 SW 교양인 [{req.req_sw_name}] 과목을 아직 수강하지 않으셨습니다.")
    
    if len(core_domains_taken) < req.req_core_domains:
        warnings.append(f"핵심교양 영역이 부족합니다. (현재 {len(core_domains_taken)}개 영역 이수 / 최소 {req.req_core_domains}개 영역 필요)")

    return jsonify({
        'success': True,
        'department': user.department,
        'is_qualified': len(warnings) == 0,
        'warnings': warnings,
        'progress': {
            'total_percent': round((total_credits / req.req_total_credits) * 100, 1),
            'major_percent': round((major_credits / req.req_major_total) * 100, 1),
            'general_percent': round((general_credits / req.req_general_total) * 100, 1),
            'current_total': total_credits,
            'req_total': req.req_total_credits,
            'remaining_total': max(0, req.req_total_credits - total_credits)
        }
    }), 200


@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/mode-select')
def mode_select():
    return render_template('mode_select.html')

@app.route('/simulator')
def simulator():
    return render_template('simulator.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)