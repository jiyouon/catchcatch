from flask import Blueprint, request, jsonify, session
from models import User, Course, Enrollment

schedule_bp = Blueprint('schedule', __name__, url_prefix='/api')


@schedule_bp.route('/courses', methods=['GET'])
def list_courses():
    keyword = request.args.get('q', '').strip()
    query = Course.query

    if keyword:
        search = f"%{keyword}%"
        query = query.filter(
            (Course.title.ilike(search)) |
            (Course.code.ilike(search)) |
            (Course.professor.ilike(search)) |
            (Course.category.ilike(search))
        )

    courses = query.order_by(Course.title).all()
    return jsonify({
        'success': True,
        'courses': [
            {
                'course_id': c.course_id,
                'code': c.code,
                'title': c.title,
                'professor': c.professor,
                'credits': c.credits,
                'category': c.category,
                'domain': c.domain,
                'day': c.day,
                'start_time': c.start_time,
                'end_time': c.end_time
            }
            for c in courses
        ]
    }), 200


@schedule_bp.route('/my-schedule/add', methods=['POST'])
def add_course():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    data = request.get_json() or {}
    course_id = data.get('course_id')
    if not course_id:
        return jsonify({'success': False, 'message': '과목 ID가 필요합니다.'}), 400

    course = Course.query.filter_by(course_id=course_id).first()
    if not course:
        return jsonify({'success': False, 'message': '해당 과목을 찾을 수 없습니다.'}), 404

    existing = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    if existing:
        return jsonify({'success': False, 'message': '이미 등록된 과목입니다.'}), 400

    conflict = Course.query.join(Enrollment, Enrollment.course_id == Course.course_id)
    conflict = conflict.filter(
        Enrollment.user_id == user_id,
        Course.day == course.day,
        Course.start_time <= course.end_time,
        Course.end_time >= course.start_time
    ).first()

    if conflict:
        return jsonify({
            'success': False,
            'message': f'동일 시간대에 이미 등록된 과목이 있습니다: {conflict.title} ({conflict.day} {conflict.start_time}-{conflict.end_time})'
        }), 400

    enrollment = Enrollment(user_id=user_id, course_id=course_id)
    from models import db
    db.session.add(enrollment)
    db.session.commit()

    return jsonify({'success': True, 'message': '과목이 시간표에 추가되었습니다.'}), 201


@schedule_bp.route('/my-schedule/delete', methods=['POST'])
def delete_course():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    data = request.get_json() or {}
    course_id = data.get('course_id')
    if not course_id:
        return jsonify({'success': False, 'message': '과목 ID가 필요합니다.'}), 400

    enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
    if not enrollment:
        return jsonify({'success': False, 'message': '삭제할 등록 과목을 찾을 수 없습니다.'}), 404

    from models import db
    db.session.delete(enrollment)
    db.session.commit()

    return jsonify({'success': True, 'message': '과목이 시간표에서 삭제되었습니다.'}), 200
