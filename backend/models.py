from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# 1. 유저 테이블
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(50), unique=True, nullable=False)   # 아이디
    password = db.Column(db.String(255), nullable=False)              # 암호화된 비밀번호
    student_id = db.Column(db.String(20), nullable=False)            # 학번 (예: 20261188)
    department = db.Column(db.String(100), nullable=False)            # 학과
    target_gpa = db.Column(db.Float, default=4.5)                     # 목표학점

# 2. 강의 테이블
class Course(db.Model):
    __tablename__ = 'courses'

    course_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code = db.Column(db.String(30), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    professor = db.Column(db.String(50), nullable=True)
    credits = db.Column(db.Float, nullable=False, default=3.0)
    category = db.Column(db.String(50), nullable=True)
    domain = db.Column(db.String(50), nullable=True)
    day = db.Column(db.String(10), nullable=True)
    start_time = db.Column(db.Integer, nullable=True)
    end_time = db.Column(db.Integer, nullable=True)


class Enrollment(db.Model):
    __tablename__ = 'enrollments'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(50), db.ForeignKey('users.user_id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), nullable=False)
    enrolled_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship('User', backref=db.backref('enrollments', lazy='dynamic'))
    course = db.relationship('Course', backref=db.backref('enrollments', lazy='dynamic'))

    __table_args__ = (
        db.UniqueConstraint('user_id', 'course_id', name='uq_user_course'),
    )


# 3. 세부 졸업요건 테이블 (졸업요건.xlsx 호환)
class GraduationRequirement(db.Model):
    __tablename__ = 'graduation_requirements'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    department = db.Column(db.String(100), nullable=False)   # 학과/학부명
    category = db.Column(db.String(50), nullable=True)       # 단과대/계열
    entry_year = db.Column(db.Integer, nullable=False, default=2026) # 입학년도

    # 학점 총량 요건
    req_general_total = db.Column(db.Integer, default=33)    # 총 교양 필요학점
    req_major_core = db.Column(db.Integer, default=24)       # 핵심전공 필요학점
    req_major_deep = db.Column(db.Integer, default=18)       # 심화전공 필요학점
    req_major_total = db.Column(db.Integer, default=42)      # 주전공 총 필요학점
    req_total_credits = db.Column(db.Integer, default=130)   # 졸업 총 필요학점

    # 세부 판독 조건
    req_sw_name = db.Column(db.String(100), nullable=True)   # 필수 SW 과목명
    req_sw_credits = db.Column(db.Integer, default=3)        # SW 필수 필요학점
    req_core_domains = db.Column(db.Integer, default=4)      # 핵심교양 필수 영역 개수
    req_specified_core = db.Column(db.String(200), nullable=True) # 지정 핵심교양 영역/과목
    req_career_credits = db.Column(db.Integer, default=3)    # 진로소양 필수 학점
    has_thesis = db.Column(db.Boolean, default=False)        # 졸업논문/실기 여부