let schedules = [
    { id: "current", name: "2026-2학기 (현재)", semester: "2026-2", courses: [] }
];
let activeScheduleId = "current";

const scheduleTabs = document.getElementById("scheduleTabs");
const loadMyScheduleBtn = document.getElementById("loadMyScheduleBtn");
const addScheduleBtn = document.getElementById("addScheduleBtn");
const scheduleBody = document.getElementById("scheduleBody");
const timeHeader = document.getElementById("timeHeader");
const myScheduleList = document.getElementById("myScheduleList");
const courseListDiv = document.getElementById("courseList");
const courseSearchInput = document.getElementById("courseSearchInput");

function getHourFromPeriod(period) {
    const p = Number(period);
    if (isNaN(p)) return null;
    return 8 + p;
}

function getActiveSchedule() {
    return schedules.find(s => s.id === activeScheduleId) || schedules[0];
}

async function checkLogin() {
    if (!scheduleTabs) return;
    try {
        const response = await fetch("/api/user/me", { credentials: "same-origin" });
        if (!response.ok) return;
        const data = await response.json();
        if (data.authenticated) {
            loadMyScheduleBtn?.classList.add("d-none");
            addScheduleBtn?.classList.remove("d-none");
        }
    } catch (error) {
        console.error("로그인 상태 확인 실패:", error);
    }
}

async function refreshAllStatus() {
    diagnoseCareSystem(getActiveSchedule().courses);

    if (typeof loadGraduationStatus === "function") {
        await loadGraduationStatus();
    }
}

// Care System 실시간 진단
function diagnoseCareSystem(courses) {
    const badgeContainer = document.getElementById("careSystemBadges");
    if (!badgeContainer) return;
    badgeContainer.innerHTML = "";

    let isMajorHeavy = false;
    let is4Consecutive = false;
    let isSpaceGap = false;

    const majorCredits = courses
        .filter(c => c.category && c.category.includes("전공"))
        .reduce((sum, c) => sum + Number(c.credits || 0), 0);
    if (majorCredits >= 15) isMajorHeavy = true;

    const days = ["월", "화", "수", "목", "금"];
    days.forEach(day => {
        const dayCourses = courses.filter(c => c.day === day && c.start_time !== null && c.end_time !== null);
        if (dayCourses.length === 0) return;

        dayCourses.sort((a, b) => Number(a.start_time) - Number(b.start_time));

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

        for (let i = 0; i < dayCourses.length - 1; i++) {
            const gap = Number(dayCourses[i + 1].start_time) - Number(dayCourses[i].end_time) - 1;
            if (gap >= 3) isSpaceGap = true;
        }
    });

    if (is4Consecutive) badgeContainer.innerHTML += `<span class="badge bg-danger fs-6 shadow-sm me-1">⚠️ 4연강 경고</span>`;
    if (isSpaceGap) badgeContainer.innerHTML += `<span class="badge bg-warning text-dark fs-6 shadow-sm me-1">⚠️ 우주공강 경고</span>`;
    if (isMajorHeavy) badgeContainer.innerHTML += `<span class="badge bg-dark fs-6 shadow-sm me-1">⚠️ 고난도 학기 경고 (전공 15+학점)</span>`;
    if (!is4Consecutive && !isSpaceGap && !isMajorHeavy && courses.length > 0) {
        badgeContainer.innerHTML += `<span class="badge bg-success fs-6 shadow-sm">✅ 쾌적한 시간표</span>`;
    }
}

// 시간표 그리드 초기화 및 렌더링
function initScheduleTable() {
    if (!scheduleBody || !timeHeader) return;

    timeHeader.innerHTML = '<th style="width: 80px;">시간</th>';
    scheduleBody.innerHTML = "";

    const days = ["월", "화", "수", "목", "금"];
    days.forEach(day => {
        const th = document.createElement("th");
        th.textContent = day;
        timeHeader.appendChild(th);
    });

    for (let hour = 8; hour <= 20; hour++) {
        const tr = document.createElement("tr");
        const timeCell = document.createElement("th");
        timeCell.className = "time-label";
        const displayPeriod = hour - 8; 
        const periodText = displayPeriod > 0 ? `(${displayPeriod}교시)` : '';
        
        timeCell.innerHTML = `<div>${hour}시</div><small class="text-muted" style="font-size: 0.75rem;">${periodText}</small>`;
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

function resetGrid() {
    document.querySelectorAll(".schedule-cell").forEach(cell => {
        cell.rowSpan = 1;
        cell.style.display = "";
        cell.classList.remove("occupied-cell");
        cell.innerHTML = "";
    });
}

function renderCourseBlock(course) {
    if (!course.day || course.start_time === null || course.end_time === null) return;

    const startHour = getHourFromPeriod(course.start_time);
    const endHour = getHourFromPeriod(course.end_time);
    const spanCount = (endHour - startHour) + 1;

    const startCell = document.querySelector(`.schedule-cell[data-day="${course.day}"][data-hour="${startHour}"]`);
    if (!startCell) return;

    startCell.rowSpan = spanCount;
    startCell.classList.add("occupied-cell");
    startCell.dataset.courseId = course.course_id;

    startCell.innerHTML = `
        <div class="course-card p-2 rounded shadow-sm position-relative text-start bg-primary text-white h-100">
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
        if (cellToHide) cellToHide.style.display = "none";
    }
}

function renderActiveScheduleView() {
    resetGrid();
    const currentSched = getActiveSchedule();
    
    currentSched.courses.forEach(course => renderCourseBlock(course));
    updateMyScheduleListView(currentSched.courses);
    diagnoseCareSystem(currentSched.courses);
    refreshAllStatus();
}

function updateMyScheduleListView(courses) {
    if (!myScheduleList) return;
    myScheduleList.innerHTML = "";

    if (courses.length === 0) {
        myScheduleList.innerHTML = '<p class="text-muted small mb-0">이 시간표에 등록된 과목이 없습니다.</p>';
        return;
    }

    courses.forEach(course => {
        const courseBox = document.createElement("div");
        courseBox.className = "border rounded p-2 mb-2 bg-white shadow-sm d-flex justify-content-between align-items-center";
        courseBox.innerHTML = `
            <div>
                <div class="fw-bold small">${course.title}</div>
                <div class="text-muted style-small" style="font-size: 0.75rem;">
                    ${course.category || "구분없음"} · ${course.credits}학점
                    ${course.day ? ` · ${course.day}` : ""}
                    ${course.start_time !== null && course.end_time !== null ? `(${course.start_time}-${course.end_time}교시)` : ""}
                </div>
            </div>
            <button class="btn btn-sm btn-outline-danger py-0 px-1 remove-list-btn" style="font-size: 0.75rem;">삭제</button>
        `;

        courseBox.querySelector(".remove-list-btn").addEventListener("click", () => deleteCourseFromSchedule(course));
        myScheduleList.appendChild(courseBox);
    });
}

// 시간표 조회 / 추가 / 삭제 API
async function loadMySchedule() {
    try {
        const currentSched = getActiveSchedule();
        const response = await fetch(`/api/my-schedule?semester=${encodeURIComponent(currentSched.semester)}`, { method: "GET", credentials: "same-origin" });
        const data = await response.json();

        if (response.ok && data.success) {
            currentSched.courses = data.courses || [];
            renderActiveScheduleView();
        }
    } catch (error) {
        console.error("내 시간표 조회 실패:", error);
    }
}

async function addCourseToSchedule(course) {
    const currentSched = getActiveSchedule();

    const hasConflict = currentSched.courses.some(item => 
        item.day === course.day &&
        item.start_time !== null && course.start_time !== null &&
        Number(item.start_time) <= Number(course.end_time) &&
        Number(course.start_time) <= Number(item.end_time)
    );

    if (hasConflict) {
        alert("⚠️ 현재 시간표에 동시간대 과목이 이미 존재합니다!");
        return;
    }

    try {
        const res = await fetch('/api/my-schedule/add', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                course_id: course.course_id,
                semester: currentSched.semester 
            })
        });
        const result = await res.json();

        if (result.success) {
            currentSched.courses.push(course);
            renderActiveScheduleView();
        } else {
            alert(result.message || "과목 추가 실패");
        }
    } catch (err) {
        alert("시간표 추가 중 오류가 발생했습니다.");
    }
}

async function deleteCourseFromSchedule(course) {
    if (!confirm(`'${course.title}' 과목을 이 시간표에서 삭제하시겠습니까?`)) return;

    const currentSched = getActiveSchedule();

    try {
        const res = await fetch('/api/my-schedule/delete', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                course_id: course.course_id,
                semester: currentSched.semester 
            })
        });
        const result = await res.json();

        if (result.success) {
            currentSched.courses = currentSched.courses.filter(c => c.course_id !== course.course_id);
            renderActiveScheduleView();
        } else {
            alert(result.message || "과목 삭제 실패");
        }
    } catch (err) {
        alert("과목 삭제 처리 중 오류가 발생했습니다.");
    }
}

// 강의 목록 검색/조회
async function fetchDashboardCourses(query = "") {
    if (!courseListDiv) return;

    try {
        const response = await fetch(`/api/courses?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!response.ok || !data.success || data.courses.length === 0) {
            courseListDiv.innerHTML = `<p class="text-muted small mb-0">검색 결과가 없습니다.</p>`;
            return;
        }

        courseListDiv.innerHTML = "";
        data.courses.forEach(course => {
            const item = document.createElement("div");
            item.className = "p-2 mb-2 border rounded d-flex justify-content-between align-items-center bg-white shadow-sm";
            item.innerHTML = `
                <div>
                    <strong class="small">${course.title}</strong> <small class="text-muted" style="font-size: 0.75rem;">(${course.code})</small><br>
                    <small class="text-secondary style-small" style="font-size: 0.75rem;">
                        ${course.professor || "미정"} | ${course.category || ""} | ${course.day || ""}${course.start_time ? ' ' + course.start_time + '-' + course.end_time + '교시' : ''}
                    </small>
                </div>
                <button class="btn btn-sm btn-outline-primary add-schedule-btn py-0 px-2" style="font-size: 0.75rem;">추가</button>
            `;

            item.querySelector(".add-schedule-btn").addEventListener("click", () => addCourseToSchedule(course));
            courseListDiv.appendChild(item);
        });
    } catch (err) {
        console.error("강의 목록 가져오기 실패:", err);
    }
}

// 탭 추가 및 탭 삭제 처리

function createNewScheduleTab() {
    const semesterInput = prompt("등록할 학기/시간표 이름을 입력해 주세요 (예: 2025-2학기, 플랜 B 등):", `시간표 ${schedules.length + 1}`);
    if (!semesterInput) return;

    const id = `schedule-${Date.now()}`;
    const newSchedule = {
        id: id,
        name: semesterInput,
        semester: semesterInput,
        courses: []
    };

    schedules.push(newSchedule);
    renderScheduleTabsUI();
    setActiveSchedule(id);
}

// 시간표 탭 전체 삭제 (DB 및 프론트 상태 일괄 삭제)
async function deleteScheduleTab(schedId, e) {
    if (e) e.stopPropagation();

    const targetSched = schedules.find(s => s.id === schedId);
    if (!targetSched) return;

    if (!confirm(`'${targetSched.name}' 시간표를 삭제하시겠습니까?\n등록된 모든 과목 데이터가 삭제됩니다.`)) return;

    try {
        const res = await fetch('/api/my-schedule/delete-semester', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ semester: targetSched.semester })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            schedules = schedules.filter(s => s.id !== schedId);
            if (activeScheduleId === schedId) {
                activeScheduleId = schedules[0] ? schedules[0].id : "current";
            }
            renderScheduleTabsUI();
            loadMySchedule();
        } else {
            alert(data.message || "시간표 삭제 실패");
        }
    } catch (err) {
        alert("시간표 삭제 처리 중 오류가 발생했습니다.");
    }
}

// 탭 버튼 UI 렌더링
function renderScheduleTabsUI() {
    if (!scheduleTabs) return;

    // 기존 탭 버튼들 제거
    const existingButtons = scheduleTabs.querySelectorAll(".schedule-tab");
    existingButtons.forEach(btn => btn.remove());

    schedules.forEach((sched, index) => {
        const btnGroup = document.createElement("div");
        btnGroup.className = "btn-group btn-group-sm schedule-tab me-1 mb-1";
        btnGroup.dataset.scheduleId = sched.id;

        const mainBtn = document.createElement("button");
        mainBtn.type = "button";
        mainBtn.className = `btn ${sched.id === activeScheduleId ? 'btn-primary' : 'btn-outline-primary'}`;
        mainBtn.textContent = sched.name;
        mainBtn.addEventListener("click", () => setActiveSchedule(sched.id));
        btnGroup.appendChild(mainBtn);

        // 첫 번째 메인 탭이 아닌 추가 탭들에 삭제(×) 버튼 추가
        if (index > 0) {
            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = `btn ${sched.id === activeScheduleId ? 'btn-primary' : 'btn-outline-primary'} border-start-0 px-2`;
            delBtn.innerHTML = "&times;";
            delBtn.title = "시간표 삭제";
            delBtn.addEventListener("click", (e) => deleteScheduleTab(sched.id, e));
            btnGroup.appendChild(delBtn);
        }

        scheduleTabs.insertBefore(btnGroup, addScheduleBtn);
    });
}

function setActiveSchedule(id) {
    activeScheduleId = id;
    renderScheduleTabsUI();
    loadMySchedule();
}

// 과목 원클릭 검색 함수 (SW필수 / 지정 핵심교양 검색 전용)
window.searchSWCourses = function(keyword) {
    if (!keyword) return;
    if (courseSearchInput) {
        courseSearchInput.value = keyword;
        fetchDashboardCourses(keyword);
        courseSearchInput.focus();
        courseSearchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

if (addScheduleBtn) {
    addScheduleBtn.addEventListener("click", createNewScheduleTab);
}

document.addEventListener("DOMContentLoaded", function () {
    checkLogin();
    initScheduleTable();
    renderScheduleTabsUI();
    loadMySchedule();
    fetchDashboardCourses();

    if (courseSearchInput) {
        courseSearchInput.addEventListener("input", (e) => {
            fetchDashboardCourses(e.target.value);
        });
    }
});