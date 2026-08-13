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
                courseBody.innerHTML = `
                        <tr>
                            <td colspan="7" class="text-center text-danger">
                                강의 목록을 불러올 수 없습니다.
                            </td>
                        </tr>
                    `;
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
                        <td>${course.start_time ?? ""} ~ ${course.end_time ?? ""}</td>
                        <td>
                            <button type="button" class="btn btn-primary btn-sm applyBtn">신청</button>
                        </td>
                    `;

                courseBody.appendChild(row);

                row.querySelector(".applyBtn").addEventListener("click", async function () {
                    // 중복 신청 확인
                    if (myCourses.some(item => item.course_id === course.course_id)) {
                        alert("이미 신청한 과목입니다.");
                        return;
                    }

                    // 최대 학점 확인
                    if (totalCredit + Number(course.credits) > 20) {
                        alert("최대 신청 가능 학점을 초과했습니다.");
                        return;
                    }

                    // 시간 충돌 확인
                    const conflict = myCourses.some(item =>
                        item.day &&
                        course.day &&
                        item.day === course.day &&
                        item.start_time !== null &&
                        course.start_time !== null &&
                        Number(item.start_time) < Number(course.end_time) &&
                        Number(course.start_time) < Number(item.end_time)
                    );

                    if (conflict) {
                        alert("이미 신청한 과목과 시간이 겹칩니다.");
                        return;
                    }

                    try {
                        // 수강신청
                        const response = await fetch("/api/my-schedule/add", {
                            method: "POST",
                            credentials: "same-origin",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                course_id: course.course_id
                            })
                        });

                        const data = await response.json();

                        if (!response.ok || !data.success) {
                            alert(data.message || "수강신청에 실패했습니다.");
                            return;
                        }

                        // 상태 반영
                        myCourses.push(course);
                        totalCredit += Number(course.credits);

                        if (currentCredit) {
                            currentCredit.textContent = totalCredit;
                        }

                        if (remainCredit) {
                            remainCredit.textContent = 20 - totalCredit;
                        }

                        // 수강신청 내역
                        if (myCourseBody) {
                            const myRow = document.createElement("tr");

                            myRow.innerHTML = `
                                    <td>${course.course_id}</td>
                                    <td>${course.title}</td>
                                    <td>${course.professor || ""}</td>
                                    <td>${course.credits}</td>
                                    <td>${course.day || ""}</td>
                                    <td>${course.start_time ?? ""} ~ ${course.end_time ?? ""}</td>
                                `;

                            myCourseBody.appendChild(myRow);
                        }

                        // 시간표 반영
                        if (course.day && course.start_time !== null && course.end_time !== null) {
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

                        // 졸업요건 갱신
                        if (typeof loadGraduationStatus === "function") {
                            await loadGraduationStatus();
                        }

                        alert("시간표에 과목이 추가되었습니다.");
                    } catch (error) {
                        console.error("수강신청 실패:", error);
                        alert("서버와 통신하는 중 오류가 발생했습니다.");
                    }
                });
            });
        } catch (error) {
            console.error("강의 목록 조회 실패:", error);

            courseBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center text-danger">
                            강의 목록을 불러올 수 없습니다.
                        </td>
                    </tr>
                `;
        }
    }

    loadCourses();
}