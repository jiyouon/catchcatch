import os
import sys

# 상위 폴더(backend) 경로를 모듈 탐색 경로에 추가
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

import re
import pandas as pd
from app import app
from models import db, Course

def import_courses():
    # 엑셀 파일 위치 탐색 (utils 폴더 내부 or backend 폴더)
    excel_path = os.path.join(current_dir, '강의.xlsx')
    if not os.path.exists(excel_path):
        excel_path = os.path.join(parent_dir, '강의.xlsx')

    if not os.path.exists(excel_path):
        print(f"❌ '강의.xlsx' 파일을 찾을 수 없습니다! (경로 확인 필요)")
        return

    df = pd.read_excel(excel_path, header=33)
    df = df.dropna(subset=['학수번호', '교과목명'])

    with app.app_context():
        Course.query.delete()
        
        for _, row in df.iterrows():
            code = str(row['학수번호']).strip()
            title = str(row['교과목명']).strip()
            professor = str(row['담당교수']).strip() if pd.notna(row['담당교수']) else '미정'
            category = str(row['이수구분']).strip() if pd.notna(row['이수구분']) else ''
            domain = str(row['영역']).strip() if pd.notna(row['영역']) else ''
            dept = str(row['개설학과전공']).strip() if pd.notna(row['개설학과전공']) else ''
            
            # 학점 파싱
            credits = 3.0
            if pd.notna(row['학점/이론/실습']):
                try:
                    credits = float(str(row['학점/이론/실습']).split('/')[0])
                except:
                    credits = 3.0

            # 시간표 파싱
            day, start_time, end_time = None, None, None
            if pd.notna(row['시간표']):
                m = re.search(r'([월화수목금토일])\/(\d+)(?:-(\d+))?', str(row['시간표']))
                if m:
                    day = m.group(1)
                    start_time = int(m.group(2))
                    end_time = int(m.group(3)) if m.group(3) else start_time

            c = Course(
                code=code,
                title=title,
                professor=professor,
                credits=credits,
                category=category,
                domain=domain,
                day=day,
                start_time=start_time,
                end_time=end_time,
                department=dept
            )
            db.session.add(c)
            
        db.session.commit()
        print(f"✅ 전체 {len(df)}개 강의 데이터가 DB에 성공적으로 저장되었습니다!")

if __name__ == '__main__':
    import_courses()