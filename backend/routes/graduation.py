from flask import Blueprint, jsonify, session, request
from models import User, GraduationRequirement, Course, Enrollment

graduation_bp = Blueprint('graduation', __name__, url_prefix='/api')

@graduation_bp.route('/graduation-check', methods=['GET'])
def check_graduation():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    user = User.query.filter_by(user_id=user_id).first()
    if not user:
        session.clear()
        return jsonify({'success': False, 'message': '사용자 정보를 찾을 수 없습니다. 다시 로그인해 주세요.'}), 401

    dept_name = user.department or ''

    req = GraduationRequirement.query.filter_by(department=dept_name).first()
    if not req:
        if '교육' in dept_name:
            req = GraduationRequirement.query.filter(GraduationRequirement.department.like('%사범대학%')).first()
        elif '스포츠' in dept_name or '운동' in dept_name:
            req = GraduationRequirement.query.filter(GraduationRequirement.department.like('%스포츠과학부%')).first()
        elif '수학' in dept_name or '통계' in dept_name or '빅데이터' in dept_name:
            req = GraduationRequirement.query.filter(GraduationRequirement.department.like('%수리통계%')).first()

    if not req:
        req = GraduationRequirement(
            department=dept_name or '기본',
            category='일반',
            req_gen_total=33,
            req_sw_code='SW문해자율',
            req_sw_credits=3,
            req_core_domains=4,
            req_core_specified='',
            req_career_total=3,
            req_major_total=42,
            req_total_credits=130
        )

    user_courses = Course.query.join(Enrollment, Enrollment.course_id == Course.course_id)\
        .filter(Enrollment.user_id == user_id).all()

    total_credits = sum(c.credits for c in user_courses)
    major_credits = sum(c.credits for c in user_courses if c.category and '전공' in c.category)
    general_credits = sum(c.credits for c in user_courses if c.category and '교양' in c.category)
    career_credits = sum(c.credits for c in user_courses if (c.category and '진로' in c.category) or (c.domain and '도전과실천' in c.domain))

    sw_code = req.req_sw_code or 'SW문해자율'
    sw_taken = False
    sw_msg = ""
    sw_search_keyword = ""

    if sw_code == '파이썬프로그래밍':
        sw_taken = any('파이썬프로그래밍' in (c.title or '') or c.code == 'SA046200' for c in user_courses)
        sw_msg = "✓ 필수 SW 과목 [파이썬프로그래밍] 수강 완료" if sw_taken else "⚠ 필수 SW 과목 [파이썬프로그래밍]을 아직 수강하지 않으셨습니다."
        sw_search_keyword = "파이썬프로그래밍"
    elif sw_code == 'AI·디지털리터러시 교육의 이해':
        sw_taken = any('AI·디지털리터러시' in (c.title or '') or c.code == 'SA049000' for c in user_courses)
        sw_msg = "✓ 필수 SW 과목 [AI·디지털리터러시 교육의 이해] 수강 완료" if sw_taken else "⚠ 필수 SW 과목 [AI·디지털리터러시 교육의 이해]를 아직 수강하지 않으셨습니다."
        sw_search_keyword = "AI·디지털리터러시"
    elif sw_code == '없음' or req.req_sw_credits == 0:
        sw_taken = True
        sw_msg = "✓ 소속 학과는 SW 필수 요건이 없습니다."
        sw_search_keyword = ""
    else:
        sw_taken = any((c.domain and 'SW문해' in c.domain) or (c.category and 'SW' in c.category) or ('파이썬' in (c.title or '')) for c in user_courses)
        sw_msg = "✓ SW 교양 영역(SW문해) 과목 수강 완료" if sw_taken else "⚠ SW 교양 영역(SW문해) 과목을 아직 수강하지 않으셨습니다."
        sw_search_keyword = "SW문해"

    core_domains_taken = set(c.domain for c in user_courses if c.category and '핵심교양' in c.category and c.domain)
    num_core_taken = len(core_domains_taken)
    core_spec = req.req_core_specified or ""

    warnings = []
    if total_credits < req.req_total_credits:
        warnings.append(f"총 학점이 {req.req_total_credits - total_credits}학점 부족합니다.")
    if general_credits < req.req_gen_total:
        warnings.append(f"교양 학점이 {req.req_gen_total - general_credits}학점 부족합니다.")
    if major_credits < req.req_major_total:
        warnings.append(f"주전공 학점이 {req.req_major_total - major_credits}학점 부족합니다.")
    if req.req_career_total > 0 and career_credits < req.req_career_total:
        warnings.append(f"진로소양 학점이 {req.req_career_total - career_credits}학점 부족합니다.")
    
    if not sw_taken and sw_code != '없음':
        warnings.append(sw_msg)

    if req.req_core_domains > 0 and num_core_taken < req.req_core_domains:
        warnings.append(f"핵심교양 영역이 부족합니다. (현재 {num_core_taken}개 영역 이수 / 필요 {req.req_core_domains}개 영역)")

    if core_spec:
        warnings.append(f"지정 핵심교양 요건: {core_spec}")

    return jsonify({
        'success': True,
        'department': dept_name,
        'category': req.category,
        'is_qualified': len(warnings) == 0,
        'warnings': warnings,
        'sw_info': {
            'code': sw_code,
            'taken': sw_taken,
            'msg': sw_msg,
            'keyword': sw_search_keyword
        },
        'core_info': {
            'req_domains': req.req_core_domains,
            'current_domains': num_core_taken,
            'specified': core_spec
        },
        'progress': {
            'total_percent': round((total_credits / req.req_total_credits) * 100, 1) if req.req_total_credits else 0,
            'major_percent': round((major_credits / req.req_major_total) * 100, 1) if req.req_major_total else 0,
            'general_percent': round((general_credits / req.req_gen_total) * 100, 1) if req.req_gen_total else 0,
            'career_percent': round((career_credits / req.req_career_total) * 100, 1) if req.req_career_total else 0,
            'current_total': total_credits,
            'current_major': major_credits,
            'current_general': general_credits,
            'current_career': career_credits,
            'req_total': req.req_total_credits,
            'req_major': req.req_major_total,
            'req_general': req.req_gen_total,
            'req_career': req.req_career_total,
            'remaining_total': max(0, req.req_total_credits - total_credits),
            'remaining_major': max(0, req.req_major_total - major_credits),
            'remaining_general': max(0, req.req_gen_total - general_credits),
            'remaining_career': max(0, req.req_career_total - career_credits)
        }
    }), 200