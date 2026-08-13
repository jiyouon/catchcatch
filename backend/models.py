from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    student_id = db.Column(db.String(20), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    target_gpa = db.Column(db.Float, default=4.5)

class Course(db.Model):
    __tablename__ = 'course'
    course_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    code = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    professor = db.Column(db.String(50))
    credits = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50))
    domain = db.Column(db.String(50))
    day = db.Column(db.String(10))
    start_time = db.Column(db.Integer)
    end_time = db.Column(db.Integer)
    department = db.Column(db.String(100))

class Enrollment(db.Model):
    __tablename__ = 'enrollment'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(50), db.ForeignKey('user.user_id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.course_id'), nullable=False)
    semester = db.Column(db.String(50), default='2026-1')

class GraduationRequirement(db.Model):
    __tablename__ = 'graduation_requirement'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    department = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    req_gen_total = db.Column(db.Integer, default=33)
    req_sw_code = db.Column(db.String(100))        # SW 필수 지정 (파이썬프로그래밍 / AI·디지털리터러시 / SW문해자율 / 없음)
    req_sw_credits = db.Column(db.Integer, default=3)
    req_core_domains = db.Column(db.Integer, default=4) # 필요 핵심교양 영역 개수
    req_core_specified = db.Column(db.String(255)) # 지정 핵심교양 과목
    req_career_total = db.Column(db.Integer, default=3)
    req_major_core = db.Column(db.Integer, default=24)
    req_major_deep = db.Column(db.Integer, default=18)
    req_major_total = db.Column(db.Integer, default=42)
    req_total_credits = db.Column(db.Integer, default=130)
    has_thesis = db.Column(db.Integer, default=0)
    entry_year = db.Column(db.Integer, default=2026)