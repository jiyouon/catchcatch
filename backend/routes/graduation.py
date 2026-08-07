from flask import Blueprint, jsonify, session
from models import User, GraduationRequirement, Course, Enrollment

graduation_bp = Blueprint('graduation', __name__, url_prefix='/api')

# [API] 졸업요건 판독
@graduation_bp.route('/graduation-check', methods=['GET'])
def check_graduation():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    user = User.query.filter_by(user_id=user_id).first()
    entry_year = int(user.student_id[:4]) if len(user.student_id) >= 4 else 2026
    
    req = GraduationRequirement.query.filter_by(
        department=user.department,
        entry_year=entry_year
    ).first()

    if not req:
        req = GraduationRequirement(
            department=user.department,
            entry_year=2026,
            req_general_total=33,
            req_major_total=42,
            req_total_credits=130
        )

    # 유저 수강 과목 연동 부분
    user_courses = Course.query.join(Enrollment, Enrollment.course_id == Course.course_id)
    user_courses = user_courses.filter(Enrollment.user_id == user_id).all()

    total_credits = sum(c.credits for c in user_courses)
    major_credits = sum(
        c.credits for c in user_courses
        if c.category and '전공' in c.category
    )
    general_credits = sum(
        c.credits for c in user_courses
        if c.category and '교양' in c.category
    )

    sw_taken = any(
        (req.req_sw_name and req.req_sw_name in (c.title or ''))
        or (c.category and 'SW문해' in c.category)
        or (c.category and 'sw' in c.category.lower())
        for c in user_courses
    )
    career_credits = sum(
        c.credits for c in user_courses
        if c.category and ('진로' in c.category or 'career' in c.category.lower())
    )
    core_domains_taken = set(
        c.domain for c in user_courses
        if c.category and '핵심교양' in c.category and c.domain
    )

    warnings = []
    if total_credits < req.req_total_credits:
        warnings.append(f"총 학점이 {req.req_total_credits - total_credits}학점 부족합니다.")
    if general_credits < req.req_general_total:
        warnings.append(f"교양 학점이 {req.req_general_total - general_credits}학점 부족합니다.")
    if major_credits < req.req_major_total:
        warnings.append(f"주전공 학점이 {req.req_major_total - major_credits}학점 부족합니다.")
    
    if req.req_sw_name and req.req_sw_credits > 0 and not sw_taken:
        warnings.append(f"필수 SW 교양인 [{req.req_sw_name}] 과목을 아직 수강하지 않으셨습니다.")

    if req.req_career_credits > 0 and career_credits < req.req_career_credits:
        warnings.append(f"진로소양 학점이 {req.req_career_credits - career_credits}학점 부족합니다.")
    
    if len(core_domains_taken) < req.req_core_domains:
        warnings.append(f"핵심교양 영역이 부족합니다. (현재 {len(core_domains_taken)}개 영역 이수 / 최소 {req.req_core_domains}개 영역 필요)")

    return jsonify({
        'success': True,
        'department': user.department,
        'is_qualified': len(warnings) == 0,
        'warnings': warnings,
        'progress': {
            'total_percent': round((total_credits / req.req_total_credits) * 100, 1) if req.req_total_credits else 0,
            'major_percent': round((major_credits / req.req_major_total) * 100, 1) if req.req_major_total else 0,
            'general_percent': round((general_credits / req.req_general_total) * 100, 1) if req.req_general_total else 0,
            'career_percent': round((career_credits / req.req_career_credits) * 100, 1) if req.req_career_credits else 0,
            'current_total': total_credits,
            'current_major': major_credits,
            'current_general': general_credits,
            'current_career': career_credits,
            'req_total': req.req_total_credits,
            'req_major': req.req_major_total,
            'req_general': req.req_general_total,
            'req_career': req.req_career_credits,
            'remaining_total': max(0, req.req_total_credits - total_credits),
            'remaining_major': max(0, req.req_major_total - major_credits),
            'remaining_general': max(0, req.req_general_total - general_credits),
            'remaining_career': max(0, req.req_career_credits - career_credits)
        }
    }), 200