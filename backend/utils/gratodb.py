import pandas as pd
from flask import Flask
from models import db, GraduationRequirement

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///catch_class.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def import_grad_requirements():
    excel_path = r'C:\Users\jiyou\OneDrive\바탕 화면\catch\졸업요건.xlsx'
    df = pd.read_excel(excel_path)
    
    req_objects = []
    for _, row in df.iterrows():
        req = GraduationRequirement(
            department=str(row['department']).strip(),
            category=str(row['category']).strip() if not pd.isna(row['category']) else None,
            entry_year=int(row['entry_year']) if 'entry_year' in row and not pd.isna(row['entry_year']) else 2026,
            req_general_total=int(row['req_gen_total']),
            req_sw_name=str(row['req_sw_code']) if not pd.isna(row['req_sw_code']) else None,
            req_sw_credits=int(row['req_sw_credits']),
            req_core_domains=int(row['req_core_domains']),
            req_specified_core=str(row['req_core_specified']) if not pd.isna(row['req_core_specified']) else None,
            req_career_credits=int(row['req_career_total']),
            req_major_core=int(row['req_major_core']),
            req_major_deep=int(row['req_major_deep']),
            req_major_total=int(row['req_major_total']),
            req_total_credits=int(row['req_total']),
            has_thesis=bool(row['has_thesis'])
        )
        req_objects.append(req)

    with app.app_context():
        db.create_all()
        # 기존 졸업요건 데이터 초기화 후 43개 학과 데이터 삽입
        GraduationRequirement.query.delete()
        db.session.bulk_save_objects(req_objects)
        db.session.commit()
        print(f"🎉 성공! '졸업요건.xlsx'의 총 {len(req_objects)}개 학과 데이터가 DB(graduation.db)에 생성되었습니다!")

if __name__ == '__main__':
    import_grad_requirements()