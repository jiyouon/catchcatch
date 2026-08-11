// 교시를 시작 시간(시)으로 변환하는 함수 (1교시 = 9시 기준)
function getHourFromPeriod(period) {
    const p = Number(period);
    if (isNaN(p)) return null;
    return 8 + p; 
}

// 시간표 그리드 생성
const scheduleBody = document.getElementById("scheduleBody");
const timeHeader = document.getElementById("timeHeader");

if (scheduleBody && timeHeader) {
    const days = ["월", "화", "수", "목", "금"];

    days.forEach(day => {
        const th = document.createElement("th");
        th.textContent = day;
        timeHeader.appendChild(th);
    });

    for (let hour = 8; hour <= 20; hour++) {
        const tr = document.createElement("tr");
        tr.id = `row-hour-${hour}`;

        const timeCell = document.createElement("th");
        timeCell.className = "time-label";
        const displayPeriod = hour - 8; 
        const periodText = displayPeriod > 0 ? `(${displayPeriod}교시)` : '';
        
        timeCell.innerHTML = `<div>${hour}시</div><small class="text-muted">${periodText}</small>`;
        tr.appendChild(timeCell);

        days.forEach(day => {
            const td = document.createElement("td");
            td.dataset.day = day;
            td.dataset.hour = hour;
            td.className = "schedule-cell";
            tr.appendChild(td);
        });

        scheduleBody.appendChild(tr);
    }
}

// 대시보드 시간표 및 Care System / 졸업요건 연동
const courseListDiv = document.getElementById("courseList");
const courseSearchInput = document.getElementById("courseSearchInput");

if (courseListDiv) {
    let currentEnrolledCourses = [];

    // <새로 작성> 1. Care System 실시간 진단 (4연강, 우주공강, 전공 몰빵)
    function diagnoseCareSystem(courses) {
        const badgeContainer = document.getElementById("careSystemBadges");
        if (!badgeContainer) return;
        badgeContainer.innerHTML = "";

        let isMajorHeavy = false;
        let is4Consecutive = false;
        let isSpaceGap = false;

        // [체크 1] 전공 몰빵 (전공 15학점 이상)
        const majorCredits = courses
            .filter(c => c.category && c.category.includes("전공"))
            .reduce((sum, c) => sum + Number(c.credits || 0), 0);
        if (majorCredits >= 15) {
            isMajorHeavy = true;
        }

        // 요일별 과목 분류
        const days = ["월", "화", "수", "목", "금"];
        days.forEach(day => {
            const dayCourses = courses.filter(c => c.day === day && c.start_time && c.end_time);
            if (dayCourses.length === 0) return;

            // 교시 정렬
            dayCourses.sort((a, b) => Number(a.start_time) - Number(b.start_time));

            // [체크 2] 4연강 체크 (연속 4교시 이상 쉬지 않고 연달아 있음)
            const occupiedPeriods = [];
            dayCourses.forEach(c => {
                for (let p = Number(c.start_time); p <= Number(c.end_time); p++) {
                    occupiedPeriods.push(p);
                }
            });
            occupiedPeriods.sort((a, b) => a - b);

            let consecutiveCount = 1;
            for (let i = 0; i < occupiedPeriods.length - 1; i++) {
                if (occupiedPeriods[i + 1] === occupiedPeriods[i] + 1) {
                    consecutiveCount++;
                    if (consecutiveCount >= 4) is4Consecutive = true;
                } else if (occupiedPeriods[i + 1] !== occupiedPeriods[i]) {
                    consecutiveCount = 1;
                }
            }

            // [체크 3] 우주공강 체크 (수업 사이 3교시 이상 빔)
            for (let i = 0; i < dayCourses.length - 1; i++) {
                const gap = Number(dayCourses[i + 1].start_time) - Number(dayCourses[i].end_time) - 1;
                if (gap >= 3) {
                    isSpaceGap = true;
                }
            }
        });

        // 뱃지 출력
        if (is4Consecutive) {
            badgeContainer.innerHTML += `<span class="badge bg-danger fs-6 shadow-sm">⚠️ 4연강 경고</span>`;
        }
        if (isSpaceGap) {
            badgeContainer.innerHTML += `<span class="badge bg-warning text-dark fs-6 shadow-sm">⚠️ 우주공강 경고</span>`;
        }
        if (isMajorHeavy) {
            badgeContainer.innerHTML += `<span class="badge bg-dark fs-6 shadow-sm">⚠️ 고난도 학기 경고 (전공 15+학점)</span>`;
        }
        if (!is4Consecutive && !isSpaceGap && !isMajorHeavy) {
            badgeContainer.innerHTML += `<span class="badge bg-success fs-6 shadow-sm">✅ 쾌적한 시간표</span>`;
        }
    }

    // <새로 작성> 2. 졸업요건 실시간 반응 프로그레스 바 업데이트
    async function updateGraduationProgress() {
        try {
            const res = await fetch('/api/graduation-check');
            const data = await res.json();

            if (!res.ok || !data.success) return;

            const p = data.progress;

            // 총 학점
            document.getElementById('totalCreditText').textContent = `${p.current_total} / ${p.req_total} 학점`;
            const totalBar = document.getElementById('totalProgressBar');
            totalBar.style.width = `${Math.min(100, p.total_percent)}%`;
            totalBar.textContent = `${p.total_percent}%`;

            // 전공 학점
            document.getElementById('majorCreditText').textContent = `${p.current_major} / ${p.req_major} 학점`;
            const majorBar = document.getElementById('majorProgressBar');
            majorBar.style.width = `${Math.min(100, p.major_percent)}%`;
            majorBar.textContent = `${p.major_percent}%`;

            // 교양 학점
            document.getElementById('generalCreditText').textContent = `${p.current_general} / ${p.req_general} 학점`;
            const generalBar = document.getElementById('generalProgressBar');
            generalBar.style.width = `${Math.min(100, p.general_percent)}%`;
            generalBar.textContent = `${p.general_percent}%`;

            // 진로소양 학점
            document.getElementById('careerCreditText').textContent = `${p.current_career} / ${p.req_career} 학점`;
            const careerBar = document.getElementById('careerProgressBar');
            careerBar.style.width = `${Math.min(100, p.career_percent)}%`;
            careerBar.textContent = `${p.career_percent}%`;

        } catch (err) {
            console.error("졸업요건 업데이트 실패:", err);
        }
    }

    // <새로 작성> 3. 내 시간표 데이터 초기 불러오기 및 렌더링
    async function loadMySchedule() {
        try {
            const res = await fetch('/api/my-schedule');
            const data = await res.json();

            if (res.ok && data.success) {
                currentEnrolledCourses = data.courses;
                
                // 시간표 그리드에 과목들 렌더링
                currentEnrolledCourses.forEach(course => {
                    renderCourseBlock(course);
                });

                // Care System 및 졸업요건 진단 업데이트
                diagnoseCareSystem(currentEnrolledCourses);
                updateGraduationProgress();
            }
        } catch (err) {
            console.error("내 시간표 로드 실패:", err);
        }
    }

    // 강의 목록 검색/조회
    async function fetchDashboardCourses(query = "") {
        try {
            const response = await fetch(`/api/courses?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (!response.ok || !data.success) {
                courseListDiv.innerHTML = `<p class="text-danger">강의를 불러오지 못했습니다.</p>`;
                return;
            }

            if (data.courses.length === 0) {
                courseListDiv.innerHTML = `<p class="text-muted">검색 결과가 없습니다.</p>`;
                return;
            }

            courseListDiv.innerHTML = "";
            data.courses.forEach(course => {
                const item = document.createElement("div");
                item.className = "p-2 mb-2 border rounded d-flex justify-content-between align-items-center bg-white shadow-sm";
                item.innerHTML = `
                    <div>
                        <strong>${course.title}</strong> <small class="text-muted">(${course.code})</small><br>
                        <small class="text-secondary">${course.professor || "미정"} | ${course.day || ""}${course.start_time ? course.start_time + '-' + course.end_time + '교시' : ''}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-primary add-schedule-btn">추가</button>
                `;

                item.querySelector(".add-schedule-btn").addEventListener("click", () => addCourseToSchedule(course));
                courseListDiv.appendChild(item);
            });
        } catch (err) {
            console.error("강의 목록 가져오기 실패:", err);
        }
    }

    // 시간표에 과목 배치 및 셀 병합(rowspan)
    function renderCourseBlock(course) {
        if (!course.day || !course.start_time || !course.end_time) return;

        const startHour = getHourFromPeriod(course.start_time);
        const endHour = getHourFromPeriod(course.end_time);
        const spanCount = (endHour - startHour) + 1;

        const startCell = document.querySelector(`.schedule-cell[data-day="${course.day}"][data-hour="${startHour}"]`);
        if (!startCell) return;

        startCell.rowSpan = spanCount;
        startCell.classList.add("occupied-cell");
        startCell.dataset.courseId = course.course_id;

        startCell.innerHTML = `
            <div class="course-card p-2 rounded shadow-sm position-relative">
                <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-1 delete-course-btn" 
                        aria-label="Close" style="font-size: 0.65rem;" title="과목 삭제"></button>
                <div class="fw-bold fs-6 mb-1">${course.title}</div>
                <div class="small opacity-75">${course.professor || ''}</div>
                <div class="small opacity-75">${startHour}:00 ~ ${endHour + 1}:00</div>
            </div>
        `;

        startCell.querySelector(".delete-course-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            deleteCourseFromSchedule(course);
        });

        for (let h = startHour + 1; h <= endHour; h++) {
            const cellToHide = document.querySelector(`.schedule-cell[data-day="${course.day}"][data-hour="${h}"]`);
            if (cellToHide) {
                cellToHide.style.display = "none";
            }
        }
    }

    // 시간표 셀 복원
    function clearCourseBlock(course) {
        if (!course.day || !course.start_time || !course.end_time) return;

        const startHour = getHourFromPeriod(course.start_time);
        const endHour = getHourFromPeriod(course.end_time);

        const startCell = document.querySelector(`.schedule-cell[data-day="${course.day}"][data-hour="${startHour}"]`);
        if (startCell) {
            startCell.rowSpan = 1;
            startCell.classList.remove("occupied-cell");
            delete startCell.dataset.courseId;
            startCell.innerHTML = "";
        }

        for (let h = startHour + 1; h <= endHour; h++) {
            const hiddenCell = document.querySelector(`.schedule-cell[data-day="${course.day}"][data-hour="${h}"]`);
            if (hiddenCell) {
                hiddenCell.style.display = "";
            }
        }
    }

    // 시간표 추가
    async function addCourseToSchedule(course) {
        try {
            const res = await fetch('/api/my-schedule/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course_id: course.course_id })
            });
            const result = await res.json();

            alert(result.message);

            if (result.success) {
                renderCourseBlock(course);
                currentEnrolledCourses.push(course);
                diagnoseCareSystem(currentEnrolledCourses);
                updateGraduationProgress(); // <새로 작성> 게이지 실시간 반영
            }
        } catch (err) {
            alert("시간표 추가 중 오류가 발생했습니다.");
        }
    }

    // 시간표 삭제
    async function deleteCourseFromSchedule(course) {
        if (!confirm(`'${course.title}' 과목을 시간표에서 삭제하시겠습니까?`)) return;

        try {
            const res = await fetch('/api/my-schedule/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course_id: course.course_id })
            });
            const result = await res.json();

            alert(result.message);

            if (result.success) {
                clearCourseBlock(course);
                currentEnrolledCourses = currentEnrolledCourses.filter(c => c.course_id !== course.course_id);
                diagnoseCareSystem(currentEnrolledCourses);
                updateGraduationProgress(); // <새로 작성> 게이지 실시간 반영
            }
        } catch (err) {
            alert("과목 삭제 처리 중 오류가 발생했습니다.");
        }
    }

    // 초기화 및 이벤트 Listen
    loadMySchedule();
    fetchDashboardCourses();
    if (courseSearchInput) {
        courseSearchInput.addEventListener("input", (e) => {
            fetchDashboardCourses(e.target.value);
        });
    }
}