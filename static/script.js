// 로그인 폼
const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        //새로고침 방지
        event.preventDefault();

        const userId = document.getElementById("userId").value.trim();
        const password = document.getElementById("password").value.trim();

        const error = document.getElementById("loginError");

        // 기존 에러메시지 삭제
        error.textContent = "";

        if (userId === "") {
            error.textContent = "아이디를 입력해주세요.";
            return;
        }

        if (password === "") {
            error.textContent = "비밀번호를 입력해주세요.";
            return;
        }

        // 로그인 버튼 비활성화
        const submitButton = loginForm.querySelector("button");
        submitButton.disabled = true;
        submitButton.textContent = "로그인 중...";

        // TODO : 백엔드 API 연결
        console.log("로그인 API 연결 예정");

        setTimeout(() => {

            // API 연결 전 임시 코드
            submitButton.disabled = false;
            submitButton.textContent = "로그인";

        }, 1000);
    });

}

// 회원가입 폼
const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const userId = document.getElementById("userId").value.trim();
        const password = document.getElementById("password").value.trim();
        const passwordCheck = document.getElementById("passwordCheck").value.trim();
        const studentId = document.getElementById("studentId").value.trim();
        const department = document.getElementById("department").value;

        const error = document.getElementById("registerError");

        // 기존 에러메시지 삭제
        error.textContent = "";

        if (userId === "") {
            error.textContent = "아이디를 입력해주세요.";
            return;
        }

        if (password.length < 8) {
            error.textContent = "비밀번호는 8자리 이상이어야 합니다.";
            return;
        }

        if (password !== passwordCheck) {
            error.textContent = "비밀번호가 일치하지 않습니다.";
            return;
        }

        if (studentId === "") {
            error.textContent = "학번을 입력해주세요.";
            return;
        }

        if (!/^[0-9]+$/.test(studentId)) {
            error.textContent = "학번은 숫자만 입력해주세요.";
            return;
        }

        const submitButton = registerForm.querySelector("button");

        submitButton.disabled = true;
        submitButton.textContent = "회원가입 중...";

        // TODO : 백엔드 API 연결
        console.log("회원가입 API 연결 예정");

        setTimeout(() => {

            submitButton.disabled = false;
            submitButton.textContent = "회원가입";

        }, 1000);
    });

}

// 시간표 생성
const scheduleBody = document.getElementById("scheduleBody");
const timeHeader = document.getElementById("timeHeader");

if (scheduleBody && timeHeader) {

    const days = ["월", "화", "수", "목", "금"];

    // 요일 생성
    days.forEach(day => {

        const th = document.createElement("th");

        th.textContent = day;

        timeHeader.appendChild(th);

    });

    // 시간 생성
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

    time.setHours(9);
    time.setMinutes(59);
    time.setSeconds(0);
    time.setMilliseconds(0);

    function updateClock() {

        time.setMilliseconds(time.getMilliseconds() + 100);

        const h = String(time.getHours()).padStart(2, "0");
        const m = String(time.getMinutes()).padStart(2, "0");
        const s = String(time.getSeconds()).padStart(2, "0");
        const ms = Math.floor(time.getMilliseconds() / 100);

        serverTime.textContent = `${h}:${m}:${s}.${ms}`;

    }

    updateClock();

    setInterval(updateClock, 100);

}

// 더미 강의 목록
const courseBody = document.getElementById("courseBody");
const myCourseBody = document.getElementById("myCourseBody");
const currentCredit = document.getElementById("currentCredit");
const remainCredit = document.getElementById("remainCredit");

if (courseBody) {

    const courses = [
        { name: "자료구조", prof: "김교수", credit: 3, day: "월", time: "10:00~12:00" },
        { name: "운영체제", prof: "이교수", credit: 3, day: "화", time: "13:00~15:00" },
        { name: "알고리즘", prof: "박교수", credit: 3, day: "수", time: "09:00~11:00" },
        { name: "컴퓨터구조", prof: "최교수", credit: 3, day: "목", time: "10:00~12:00" },
        { name: "데이터베이스", prof: "정교수", credit: 3, day: "금", time: "14:00~16:00" },
        { name: "웹프로그래밍", prof: "윤교수", credit: 3, day: "월", time: "15:00~17:00" },
        { name: "소프트웨어공학", prof: "강교수", credit: 3, day: "화", time: "09:00~11:00" },
        { name: "AI개론", prof: "한교수", credit: 3, day: "수", time: "13:00~15:00" }
    ];

    let totalCredit = 0;
    const myCourses = [];

    courses.forEach(course => {

        const row = document.createElement("tr");

        row.innerHTML = `
<td><button class="btn btn-primary btn-sm applyBtn">신청</button></td>
<td>${course.name}</td>
<td>${course.prof}</td>
<td>${course.credit}</td>
<td>${course.day}</td>
<td>${course.time}</td>
`;

        courseBody.appendChild(row);

        row.querySelector(".applyBtn").addEventListener("click", function () {

            if (myCourses.includes(course.name)) {
                alert("이미 신청한 과목입니다.");
                return;
            }

            if (totalCredit + course.credit > 20) {
                alert("최대 신청 가능 학점을 초과했습니다.");
                return;
            }

            myCourses.push(course.name);

            totalCredit += course.credit;

            currentCredit.textContent = totalCredit;
            remainCredit.textContent = 20 - totalCredit;

            myCourseBody.innerHTML += `
<tr>
<td>${course.name}</td>
<td>${course.prof}</td>
<td>${course.credit}</td>
<td>${course.day}</td>
<td>${course.time}</td>
</tr>
`;

        });

    });

}

document.addEventListener("click", function (e) {

    if (e.target.classList.contains("applyBtn")) {

        console.log("신청 버튼 클릭");

    }

});