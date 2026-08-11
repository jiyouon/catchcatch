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
@graduation_bp.route('/gpa-calculator', methods=['POST'])
def calculate_target_gpa():
    """
    [5단계] 목표 학점 산출 API
    수신 데이터 (JSON):
    - current_credits: 현재까지 이수한 학점 (예: 45)
    - current_gpa: 현재 평균 평점 (예: 3.5)
    - target_gpa: 최종 목표 평점 (예: 4.0)
    - remaining_credits: 앞으로 들을 남은 학점 (예: 85)
    """
    data = request.get_json() or {}
    
    try:
        current_credits = float(data.get('current_credits', 0))
        current_gpa = float(data.get('current_gpa', 0.0))
        target_gpa = float(data.get('target_gpa', 4.5))
        remaining_credits = float(data.get('remaining_credits', 0))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': '올바른 숫자 형식을 입력해주세요.'}), 400

    if remaining_credits <= 0:
        return jsonify({
            'success': False, 
            'message': '남은 학점이 0학점이하인 경우 계산할 수 없습니다.'
        }), 400

    total_credits = current_credits + remaining_credits
    
    # 필요 총 평점 점수 계산
    required_total_points = target_gpa * total_credits
    current_points = current_gpa * current_credits
    needed_points = required_total_points - current_points
    
    # 남은 학점 동안 받아야 하는 최소 평균 평점
    required_gpa = round(needed_points / remaining_credits, 2)
    
    # 4.5 만점 기준 달성 가능 여부 판단
    is_possible = required_gpa <= 4.5
    
    warning_message = None
    if required_gpa > 4.5:
        warning_message = f"목표 평점({target_gpa})을 달성하려면 남은 학점 동안 평점 {required_gpa}점이 필요합니다. (만점 4.5 초과로 달성 불가)"
    elif required_gpa < 0:
        required_gpa = 0.0  # 이미 목표 평점을 초과 달성한 경우
        warning_message = "이미 목표 평점을 달성하셨습니다!"

    return jsonify({
        'success': True,
        'current_credits': current_credits,
        'current_gpa': current_gpa,
        'target_gpa': target_gpa,
        'remaining_credits': remaining_credits,
        'required_gpa': max(0.0, required_gpa),
        'is_possible': is_possible,
        'warning_message': warning_message
    }), 200