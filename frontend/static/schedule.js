// 시간표 
const scheduleBody = document.getElementById("scheduleBody");
const timeHeader = document.getElementById("timeHeader");

if (scheduleBody && timeHeader) {

    const days = ["월", "화", "수", "목", "금"];

    // 요일 
    days.forEach(day => {

        const th = document.createElement("th");

        th.textContent = day;

        timeHeader.appendChild(th);

    });

    // 시간 
    for (let hour = 8; hour <= 24; hour++) {

        const tr = document.createElement("tr");

        const timeCell = document.createElement("th");

        let displayHour;

        if (hour <= 12) {

            displayHour = hour;

        } else if (hour === 24) {

            displayHour = 12;

        } else {

            displayHour = hour - 12;

        }

        timeCell.textContent = displayHour + "시";

        tr.appendChild(timeCell);
        // 시간표 셀
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

// 서버 시계
const serverTime = document.getElementById("serverTime");

if (serverTime) {

    let time = new Date();
    // 초기값
    time.setHours(9);
    time.setMinutes(59);
    time.setSeconds(0);
    time.setMilliseconds(0);

    function updateClock() {

        time.setMilliseconds(time.getMilliseconds() + 100); // 시간 갱신

        const h = String(time.getHours()).padStart(2, "0");
        const m = String(time.getMinutes()).padStart(2, "0");
        const s = String(time.getSeconds()).padStart(2, "0");
        const ms = Math.floor(time.getMilliseconds() / 100);

        serverTime.textContent = `${h}:${m}:${s}.${ms}`;

    }

    updateClock();

    setInterval(updateClock, 100);

}

// 수강신청 시뮬레이터
const courseBody = document.getElementById("courseBody");
const myCourseBody = document.getElementById("myCourseBody");
const currentCredit = document.getElementById("currentCredit");
const remainCredit = document.getElementById("remainCredit");

if (courseBody) {
    let totalCredit = 0;
    const myCourses = [];

    // 강의 목록 조회
    async function loadCourses() {
        try {
            const response = await fetch("/api/courses");
            const data = await response.json();

            if (!response.ok || !data.success) {
                courseBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">강의 목록을 불러올 수 없습니다.</td></tr>`;
                return;
            }

            courseBody.innerHTML = "";

            data.courses.forEach(course => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${course.course_id}</td>
                    <td>${course.title}</td>
                    <td>${course.professor || ""}</td>
                    <td>${course.credits}</td>
                    <td>${course.day || ""}</td>
                    <td>${course.start_time || ""} ~ ${course.end_time || ""}</td>
                    <td><button type="button" class="btn btn-primary btn-sm applyBtn">신청</button></td>
                `;

                courseBody.appendChild(row);

                row.querySelector(".applyBtn").addEventListener("click", function () {
                    if (myCourses.some(item => item.course_id === course.course_id)) {
                        alert("이미 신청한 과목입니다.");
                        return;
                    }

                    if (totalCredit + Number(course.credits) > 20) {
                        alert("최대 신청 가능 학점을 초과했습니다.");
                        return;
                    }

                    // 중복 확인
                    const conflict = myCourses.some(item =>
                        item.day &&
                        course.day &&
                        item.day === course.day &&
                        item.start_time &&
                        course.start_time &&
                        item.start_time < course.end_time &&
                        course.start_time < item.end_time
                    );

                    if (conflict) {
                        alert("이미 신청한 과목과 시간이 겹칩니다.");
                        return;
                    }

                    myCourses.push(course);
                    totalCredit += Number(course.credits);

                    currentCredit.textContent = totalCredit;
                    remainCredit.textContent = 20 - totalCredit;
                    
                    // 시간표 반영
                    if (course.day && course.start_time && course.end_time) {
                        const startTime = Number(course.start_time);
                        const endTime = Number(course.end_time);

                        for (let hour = startTime; hour < endTime; hour++) {
                            const cell = document.querySelector(
                                `.schedule-cell[data-day="${course.day}"][data-hour="${hour}"]`
                            );

                            if (cell) {
                                cell.textContent = course.title;
                            }
                        }
                    }

                    const myRow = document.createElement("tr");

                    myRow.innerHTML = `
                        <td>${course.course_id}</td>
                        <td>${course.title}</td>
                        <td>${course.professor || ""}</td>
                        <td>${course.credits}</td>
                        <td>${course.day || ""}</td>
                        <td>${course.start_time || ""} ~ ${course.end_time || ""}</td>
                    `;

                    myCourseBody.appendChild(myRow);
                });
            });
        } catch (error) {
            console.error("강의 목록 조회 실패:", error);
            courseBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">강의 목록을 불러올 수 없습니다.</td></tr>`;
        }
    }

    loadCourses();
}