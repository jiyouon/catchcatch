import re
import pandas as pd
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# 1. Flask 서버 및 SQLite DB 연결 설정
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///catch_class.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# 2. 강의 테이블 모델 정의 (엑셀 파일 항목 전체 반영)
class Course(db.Model):
    __tablename__ = 'courses'

    course_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    no = db.Column(db.Integer, nullable=True)                        # No
    department = db.Column(db.String(100), nullable=True)             # 개설학과전공
    code = db.Column(db.String(30), nullable=False)                  # 학수번호
    title = db.Column(db.String(150), nullable=False)                # 교과목명
    division = db.Column(db.Integer, nullable=True)                  # 분반
    category = db.Column(db.String(50), nullable=True)               # 이수구분
    domain = db.Column(db.String(50), nullable=True)                 # 영역
    detail_category = db.Column(db.String(100), nullable=True)       # 교과세부
    credit_info = db.Column(db.String(30), nullable=True)            # 학점/이론/실습 (원본)
    capacity = db.Column(db.String(30), nullable=True)               # 수강정원
    credit_exchange = db.Column(db.String(30), nullable=True)        # 학점교류
    schedule = db.Column(db.String(100), nullable=True)              # 시간표 (원본 문자열, 예: 월/4-6)
    classroom = db.Column(db.String(100), nullable=True)             # 강의실
    professor = db.Column(db.String(50), nullable=True)              # 담당교수
    campus = db.Column(db.String(30), nullable=True)                 # 캠퍼스
    course_type = db.Column(db.String(50), nullable=True)            # 수업유형
    remarks = db.Column(db.Text, nullable=True)                      # 수강안내 및 지정내용

    # 💡 프론트엔드/시간표 연동용 파싱 필드 (편의 기능)
    credits = db.Column(db.Float, nullable=False, default=3.0)       # 숫자로 변환된 학점 (예: 3.0)
    day = db.Column(db.String(10), nullable=True)                    # 요일 (월, 화, 수...)
    start_time = db.Column(db.Integer, nullable=True)               # 시작교시
    end_time = db.Column(db.Integer, nullable=True)                 # 종료교시


# 3. 시간표 문자열 파싱 함수 ('화/4-6' -> '화', 4, 6)
def parse_schedule(time_str):
    if pd.isna(time_str) or not isinstance(time_str, str):
        return None, None, None
    
    match = re.search(r'([월화수목금토일])\/(\d+)(?:-(\d+))?', time_str)
    if match:
        day = match.group(1)
        start_time = int(match.group(2))
        end_time = int(match.group(3)) if match.group(3) else start_time
        return day, start_time, end_time
    
    return None, None, None


# 4. 엑셀 파싱 및 DB 밀어넣기
def import_excel_data():
    file_path = r'C:\Users\jiyou\OneDrive\바탕 화면\catch\강의.xlsx'
    
    # 33번 행을 헤더(열 이름)로 지정하여 읽기
    df = pd.read_excel(file_path, header=33)
    courses_to_insert = []
    
    for _, row in df.iterrows():
        try:
            # 필수 데이터(학수번호, 교과목명) 체크
            code = str(row['학수번호']).strip() if not pd.isna(row['학수번호']) else ''
            title = str(row['교과목명']).strip() if not pd.isna(row['교과목명']) else ''
            
            if not code or code == 'nan' or not title or title == 'nan':
                continue

            # 문자열/숫자 처리
            no = int(row['No']) if not pd.isna(row['No']) else None
            department = str(row['개설학과전공']).strip() if not pd.isna(row['개설학과전공']) else None
            division = int(row['분반']) if not pd.isna(row['분반']) else None
            category = str(row['이수구분']).strip() if not pd.isna(row['이수구분']) else None
            domain = str(row['영역']).strip() if not pd.isna(row['영역']) else None
            detail_category = str(row['교과세부']).strip() if not pd.isna(row['교과세부']) else None
            
            credit_info = str(row['학점/이론/실습']).strip() if not pd.isna(row['학점/이론/실습']) else None
            # 학점 숫자 파싱 (예: '3.0/3.0/0.0' -> 3.0)
            credits = float(credit_info.split('/')[0]) if credit_info and '/' in credit_info else 3.0

            capacity = str(row['수강정원']).strip() if not pd.isna(row['수강정원']) else None
            credit_exchange = str(row['학점교류']).strip() if not pd.isna(row['학점교류']) else None
            
            schedule = str(row['시간표']).strip() if not pd.isna(row['시간표']) else None
            day, start_time, end_time = parse_schedule(schedule)

            classroom = str(row['강의실']).strip() if not pd.isna(row['강의실']) else None
            professor = str(row['담당교수']).strip() if not pd.isna(row['담당교수']) else "미정"
            campus = str(row['캠퍼스']).strip() if not pd.isna(row['캠퍼스']) else None
            course_type = str(row['수업유형']).strip() if not pd.isna(row['수업유형']) else None
            remarks = str(row['수강안내 및 지정내용']).strip() if not pd.isna(row['수강안내 및 지정내용']) else None

            course = Course(
                no=no,
                department=department,
                code=code,
                title=title,
                division=division,
                category=category,
                domain=domain,
                detail_category=detail_category,
                credit_info=credit_info,
                capacity=capacity,
                credit_exchange=credit_exchange,
                schedule=schedule,
                classroom=classroom,
                professor=professor,
                campus=campus,
                course_type=course_type,
                remarks=remarks,
                # 연동용 필드
                credits=credits,
                day=day,
                start_time=start_time,
                end_time=end_time
            )
            courses_to_insert.append(course)
            
        except Exception as e:
            continue

    # DB 저장
    with app.app_context():
        # 컬럼 구조가 변경되었으므로 기존 DB를 새로 덮어쓰기 위해 drop_all 후 create_all 실행
        db.drop_all()
        db.create_all()
        
        db.session.bulk_save_objects(courses_to_insert)
        db.session.commit()
        
        print(f"🎉 성공! 총 {len(courses_to_insert)}개 강의가 엑셀 전체 정리본 구조로 DB에 등록되었습니다!")

if __name__ == '__main__':
    import_excel_data()