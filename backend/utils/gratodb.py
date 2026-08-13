import os
import sys

# 상위 폴더(backend) 경로를 모듈 탐색 경로에 추가
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

import pandas as pd
from app import app
from models import db, GraduationRequirement

def import_graduation_requirements():
    # 엑셀 파일 위치 탐색 (utils 폴더 내부 or backend 폴더)
    excel_path = os.path.join(current_dir, '졸업요건.xlsx')
    if not os.path.exists(excel_path):
        excel_path = os.path.join(parent_dir, '졸업요건.xlsx')

    if not os.path.exists(excel_path):
        print(f"❌ '졸업요건.xlsx' 파일을 찾을 수 없습니다! (경로 확인 필요)")
        return

    df = pd.read_excel(excel_path)

    with app.app_context():
        # 기존 졸업요건 데이터 초기화
        GraduationRequirement.query.delete()
        
        for _, row in df.iterrows():
            dept = str(row['department']).strip()
            cat = str(row['category']).strip() if pd.notna(row['category']) else ''
            req_gen = int(row['req_gen_total']) if pd.notna(row['req_gen_total']) else 33
            sw_code = str(row['req_sw_code']).strip() if pd.notna(row['req_sw_code']) else 'SW문해자율'
            sw_credits = int(row['req_sw_credits']) if pd.notna(row['req_sw_credits']) else 3
            core_domains = int(row['req_core_domains']) if pd.notna(row['req_core_domains']) else 4
            core_spec = str(row['req_core_specified']).strip() if pd.notna(row['req_core_specified']) else ''
            career = int(row['req_career_total']) if pd.notna(row['req_career_total']) else 3
            major_core = int(row['req_major_core']) if pd.notna(row['req_major_core']) else 24
            major_deep = int(row['req_major_deep']) if pd.notna(row['req_major_deep']) else 18
            major_total = int(row['req_major_total']) if pd.notna(row['req_major_total']) else 42
            req_total = int(row['req_total']) if pd.notna(row['req_total']) else 130
            has_thesis = int(row['has_thesis']) if pd.notna(row['has_thesis']) else 0
            entry_year = int(row['entry_year']) if pd.notna(row['entry_year']) else 2026

            req = GraduationRequirement(
                department=dept,
                category=cat,
                req_gen_total=req_gen,
                req_sw_code=sw_code,
                req_sw_credits=sw_credits,
                req_core_domains=core_domains,
                req_core_specified=core_spec,
                req_career_total=career,
                req_major_core=major_core,
                req_major_deep=major_deep,
                req_major_total=major_total,
                req_total_credits=req_total,
                has_thesis=has_thesis,
                entry_year=entry_year
            )
            db.session.add(req)
            
        db.session.commit()
        print("✅ 졸업요건 엑셀 데이터가 DB에 성공적으로 저장되었습니다!")

if __name__ == '__main__':
    import_graduation_requirements()