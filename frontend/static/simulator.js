let isHardMode = false;
let allCourses = [];
let myFavCourses = [];
let enrolledCourses = [];
let isCourseOpen = false;

// 기본 오픈 목표 시간 (오전 10시 00분 00초)
let targetOpenHour = 10;
let targetOpenMinute = 0;

document.addEventListener("DOMContentLoaded", function () {
    const serverTimeEl = document.getElementById("serverTime");
    const modeToggle = document.getElementById("difficultyToggle");
    const modeLabel = document.getElementById("modeLabel");
    const modeDesc = document.getElementById("modeDesc");
    const statusMsg = document.getElementById("statusMessage");

    const targetTimeInput = document.getElementById("targetOpenTimeInput");
    const applyTimeBtn = document.getElementById("applyOpenTimeBtn");

    // 탭 메뉴 버튼
    const tabFavMenu = document.getElementById("tabFavMenu");
    const tabApplyMenu = document.getElementById("tabApplyMenu");
    const viewApplyPage = document.getElementById("viewApplyPage");
    const viewFavPage = document.getElementById("viewFavPage");

    // 수강신청 시작 시간 설정 적용 버튼
    if (applyTimeBtn && targetTimeInput) {
        // 기본값 세팅 (현재 시각보다 5초 뒤 또는 입력한 시간)
        let nowInit = new Date();
        nowInit.setSeconds(nowInit.getSeconds() + 10);
        targetOpenHour = nowInit.getHours();
        targetOpenMinute = nowInit.getMinutes();
        targetTimeInput.value = `${String(targetOpenHour).padStart(2,'0')}:${String(targetOpenMinute).padStart(2,'0')}`;

        applyTimeBtn.addEventListener("click", () => {
            const timeVal = targetTimeInput.value; // "HH:MM"
            if (!timeVal) return;
            const parts = timeVal.split(":");
            targetOpenHour = parseInt(parts[0], 10);
            targetOpenMinute = parseInt(parts[1], 10);

            // 시뮬레이터 시계를 해당 시간 5초전으로 맞춤
            simTime = new Date();
            simTime.setHours(targetOpenHour, targetOpenMinute - 1, 55, 0);
            isCourseOpen = false;

            alert(`⏱️ 수강신청 오픈 시간이 [${String(targetOpenHour).padStart(2,'0')}:${String(targetOpenMinute).padStart(2,'0')}:00]으로 설정되었습니다!`);
            renderApplyPageCourses();
        });
    }

    // 메뉴 뷰 전환 (관심강좌 신청 vs 수강신청)
    if (tabFavMenu && tabApplyMenu) {
        tabFavMenu.addEventListener("click", () => {
            tabFavMenu.classList.add("text-primary", "fw-bold", "active-menu");
            tabFavMenu.classList.remove("text-secondary");
            tabApplyMenu.classList.remove("text-primary", "fw-bold", "active-menu");
            tabApplyMenu.classList.add("text-secondary");

            viewFavPage.classList.remove("d-none");
            viewApplyPage.classList.add("d-none");
        });

        tabApplyMenu.addEventListener("click", () => {
            tabApplyMenu.classList.add("text-primary", "fw-bold", "active-menu");
            tabApplyMenu.classList.remove("text-secondary");
            tabFavMenu.classList.remove("text-primary", "fw-bold", "active-menu");
            tabFavMenu.classList.add("text-secondary");

            viewApplyPage.classList.remove("d-none");
            viewFavPage.classList.add("d-none");

            renderApplyPageCourses();
        });
    }

    // 0.1초 서버 시계 & 오픈 판독
    let simTime = new Date();
    simTime.setHours(targetOpenHour, targetOpenMinute - 1, 55, 0);

    function updateSimClock() {
        simTime.setMilliseconds(simTime.getMilliseconds() + 100);

        const h = String(simTime.getHours()).padStart(2, "0");
        const m = String(simTime.getMinutes()).padStart(2, "0");
        const s = String(simTime.getSeconds()).padStart(2, "0");
        const ms = Math.floor(simTime.getMilliseconds() / 100);

        if (serverTimeEl) serverTimeEl.textContent = `${h}:${m}:${s}.${ms}`;

        // 설정된 오픈 시간 도달 여부 체크
        const currentTotalSec = simTime.getHours() * 3600 + simTime.getMinutes() * 60 + simTime.getSeconds();
        const targetTotalSec = targetOpenHour * 3600 + targetOpenMinute * 60;

        if (currentTotalSec >= targetTotalSec && !isCourseOpen) {
            isCourseOpen = true;
            if (statusMsg) {
                statusMsg.textContent = "[수강신청 기간입니다.]";
                statusMsg.className = "text-center text-success fw-bold mb-2";
            }
            renderApplyPageCourses();
        } else if (currentTotalSec < targetTotalSec && isCourseOpen) {
            isCourseOpen = false;
            if (statusMsg) {
                statusMsg.textContent = "[수강신청 기간이 아닙니다.]";
                statusMsg.className = "text-center text-danger fw-bold mb-2";
            }
            renderApplyPageCourses();
        }
    }
    setInterval(updateSimClock, 100);

    // 난이도 모드 스위치
    if (modeToggle) {
        modeToggle.addEventListener("change", function (e) {
            isHardMode = e.target.checked;
            if (isHardMode) {
                modeLabel.textContent = "매운맛 (Hard)";
                modeLabel.className = "form-check-input-label small fw-semibold text-danger";
                modeDesc.textContent = "* 대기열 팝업 및 정원초과 피켓팅이 적용됩니다.";
            } else {
                modeLabel.textContent = "쉬움 (Easy)";
                modeLabel.className = "form-check-input-label small fw-semibold text-success";
                modeDesc.textContent = "* 클릭 즉시 신청 성공 모드입니다.";
            }
        });
    }

    function showPortalAlert(msg) {
        const modalMsg = document.getElementById("alertModalMessage");
        if (modalMsg) modalMsg.textContent = msg;

        const alertModalEl = document.getElementById("portalAlertModal");
        if (alertModalEl) {
            const alertModal = new bootstrap.Modal(alertModalEl);
            alertModal.show();
        } else {
            alert(msg);
        }
    }

    // 관심강좌 신청 메뉴 로직
    async function fetchAllCoursesForFav(query = "") {
        try {
            const res = await fetch(`/api/courses?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (res.ok && data.success) {
                allCourses = data.courses;
                renderAllCoursesForFav();
            }
        } catch (err) {
            console.error("강의 로드 실패:", err);
        }
    }

    function renderAllCoursesForFav() {
        const body = document.getElementById("allCourseForFavBody");
        if (!body) return;
        body.innerHTML = "";

        if (allCourses.length === 0) {
            body.innerHTML = `<tr><td colspan="9" class="text-muted py-3">개설 과목이 없습니다.</td></tr>`;
            return;
        }

        allCourses.slice(0, 15).forEach((c, idx) => {
            const tr = document.createElement("tr");
            const isAdded = myFavCourses.some(f => f.course_id === c.course_id);

            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>
                    <button class="btn btn-xs ${isAdded ? 'btn-secondary disabled' : 'btn-teal'} py-0 px-2 style-small add-fav-btn" style="font-size:0.72rem;">
                        ${isAdded ? '담김' : '관심담기'}
                    </button>
                </td>
                <td>${c.department || "창의융합학부"}</td>
                <td>${c.code}</td>
                <td class="fw-bold text-start">${c.title}</td>
                <td>${c.category || "공통교양"}</td>
                <td>${c.credits}</td>
                <td>${c.day || "금"}/${c.start_time || 1}-${c.end_time || 3}</td>
                <td>${c.professor || "교수미정"}</td>
            `;

            tr.querySelector(".add-fav-btn").addEventListener("click", () => {
                if (!isAdded) {
                    myFavCourses.push(c);
                    showPortalAlert(`'${c.title}' 과목이 관심강좌에 담겼습니다.`);
                    renderAllCoursesForFav();
                    renderMyFavCourses();
                }
            });

            body.appendChild(tr);
        });
    }

    function renderMyFavCourses() {
        const body = document.getElementById("myFavCourseBody");
        const countEl = document.getElementById("myFavCount");
        if (!body) return;

        body.innerHTML = "";
        if (countEl) countEl.textContent = myFavCourses.length;

        if (myFavCourses.length === 0) {
            body.innerHTML = `<tr><td colspan="10" class="text-muted py-3">담아둔 관심강좌가 없습니다. 상단 강좌에서 관심담기를 클릭하세요.</td></tr>`;
            return;
        }

        myFavCourses.forEach((c, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>
                    <button class="btn-portal-cancel remove-fav-btn">취소</button>
                </td>
                <td>${c.department || "창의융합학부"}</td>
                <td>${c.code}</td>
                <td class="fw-bold text-start">${c.title}</td>
                <td>001</td>
                <td>${c.category || "공통교양"}</td>
                <td>${c.credits}</td>
                <td>${c.day || "금"}/${c.start_time || 1}-${c.end_time || 3}</td>
                <td>${c.professor || "교수미정"}</td>
            `;

            tr.querySelector(".remove-fav-btn").addEventListener("click", () => {
                myFavCourses = myFavCourses.filter(f => f.course_id !== c.course_id);
                showPortalAlert(`'${c.title}' 관심강좌가 취소되었습니다.`);
                renderAllCoursesForFav();
                renderMyFavCourses();
            });

            body.appendChild(tr);
        });
    }

    // 수강신청 메뉴 로직
    function renderApplyPageCourses() {
        const categorySelect = document.getElementById("simCategorySelect");
        const selectedCat = categorySelect ? categorySelect.value : "관심강좌";
        const body = document.getElementById("searchedCourseBody");
        const countEl = document.getElementById("searchCount");
        if (!body) return;

        body.innerHTML = "";

        let targetList = (selectedCat === "관심강좌") ? myFavCourses : allCourses.filter(c => c.category && c.category.includes(selectedCat));

        if (countEl) countEl.textContent = targetList.length;

        if (targetList.length === 0) {
            const emptyMsg = (selectedCat === "관심강좌") 
                ? "담아둔 관심강좌가 없습니다. '관심강좌 신청' 메뉴에서 먼저 담아보세요!" 
                : "조회된 과목이 없습니다.";
            body.innerHTML = `<tr><td colspan="14" class="text-muted py-4">${emptyMsg}</td></tr>`;
            return;
        }

        targetList.forEach((c, idx) => {
            const tr = document.createElement("tr");
            const btnState = isCourseOpen ? "" : "disabled";

            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>
                    <button class="btn-portal-apply apply-sim-btn ${btnState}">
                        신청
                    </button>
                </td>
                <td>${c.department || "창의융합학부"}</td>
                <td>${c.code}</td>
                <td class="fw-bold text-start">${c.title}</td>
                <td>001</td>
                <td>${c.category || "공통교양"}</td>
                <td>${c.domain || "영역없음"}</td>
                <td>-</td>
                <td>${c.credits}.0/3.0/0.0</td>
                <td>30</td>
                <td>${Math.floor(Math.random() * 15) + 15}</td>
                <td>${c.day || "금"}/${c.start_time || 1}-${c.end_time || 3}</td>
                <td>${c.professor || "교수미정"}</td>
            `;

            tr.querySelector(".apply-sim-btn").addEventListener("click", () => handleApplyCourse(c));
            body.appendChild(tr);
        });
    }

    function handleApplyCourse(course) {
        if (!isCourseOpen) {
            showPortalAlert("수강신청 기간이 아닙니다.");
            return;
        }

        if (enrolledCourses.some(e => e.course_id === course.course_id)) {
            showPortalAlert("이미 신청 완료된 과목입니다.");
            return;
        }

        if (isHardMode) {
            let queueModalEl = document.getElementById("waitingQueueModal");
            let queueModal = new bootstrap.Modal(queueModalEl);
            let queueTimeEl = document.getElementById("queueTime");
            let queueFrontEl = document.getElementById("queueFront");
            let queueBackEl = document.getElementById("queueBack");
            let progressBar = document.getElementById("queueProgressBar");

            let queueFront = Math.floor(Math.random() * 2000) + 1500;
            let queueBack = Math.floor(Math.random() * 10) + 1;
            let estimatedSec = Math.floor(queueFront / 1000) + 1;

            if (queueFrontEl) queueFrontEl.textContent = queueFront;
            if (queueBackEl) queueBackEl.textContent = queueBack;
            if (queueTimeEl) queueTimeEl.textContent = String(estimatedSec).padStart(2, "0");
            if (progressBar) progressBar.style.width = "100%";

            queueModal.show();

            let interval = setInterval(() => {
                queueFront -= Math.floor(Math.random() * 400) + 300;
                if (queueFront < 0) queueFront = 0;
                
                if (queueFrontEl) queueFrontEl.textContent = queueFront;
                if (progressBar) progressBar.style.width = `${(queueFront / 2500) * 100}%`;

                if (queueFront <= 0) {
                    clearInterval(interval);
                    queueModal.hide();

                    if (Math.random() < 0.5) {
                        showPortalAlert(`수강 정원이 초과되었습니다.`);
                    } else {
                        showPortalAlert(`${course.title} 과목이 수강신청 되었습니다.`);
                        enrollCourse(course);
                    }
                }
            }, 400);

        } else {
            showPortalAlert(`${course.title} 과목이 수강신청 되었습니다.`);
            enrollCourse(course);
        }
    }

    function enrollCourse(course) {
        enrolledCourses.push(course);
        renderEnrolledCourses();
    }

    function renderEnrolledCourses() {
        const body = document.getElementById("enrolledCourseBody");
        const creditsBadge = document.getElementById("badgeCurrentCredits");
        const enrolledCountEl = document.getElementById("enrolledCount");
        if (!body) return;

        body.innerHTML = "";
        const totalCredits = enrolledCourses.reduce((sum, c) => sum + Number(c.credits || 0), 0);
        if (creditsBadge) creditsBadge.textContent = totalCredits;
        if (enrolledCountEl) enrolledCountEl.textContent = enrolledCourses.length;

        if (enrolledCourses.length === 0) {
            body.innerHTML = `<tr><td colspan="15" class="text-muted py-3">신청된 수강 강좌가 없습니다.</td></tr>`;
            return;
        }

        enrolledCourses.forEach((c, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>
                    <button class="btn-portal-cancel cancel-sim-btn">취소</button>
                </td>
                <td>${c.department || "창의융합학부"}</td>
                <td>${c.code}</td>
                <td class="fw-bold text-start">${c.title}</td>
                <td>001</td>
                <td>${c.category || "공통교양"}</td>
                <td>${c.domain || "영역없음"}</td>
                <td>-</td>
                <td>${c.credits}.0/3.0/0.0</td>
                <td>30</td>
                <td>${Math.floor(Math.random() * 10) + 20}</td>
                <td>${c.day || "금"}/${c.start_time || 1}-${c.end_time || 3}</td>
                <td>${c.professor || "교수미정"}</td>
                <td>최초수강</td>
            `;

            tr.querySelector(".cancel-sim-btn").addEventListener("click", () => {
                enrolledCourses = enrolledCourses.filter(e => e.course_id !== c.course_id);
                showPortalAlert(`${c.title} 과목 수강신청이 취소되었습니다.`);
                renderEnrolledCourses();
            });

            body.appendChild(tr);
        });
    }

    const categorySelect = document.getElementById("simCategorySelect");
    if (categorySelect) {
        categorySelect.addEventListener("change", renderApplyPageCourses);
    }

    const favSearchBtn = document.getElementById("favSearchBtn");
    const favSearchInput = document.getElementById("favCourseSearchInput");
    if (favSearchBtn && favSearchInput) {
        favSearchBtn.addEventListener("click", () => {
            fetchAllCoursesForFav(favSearchInput.value.trim());
        });
    }

    // 초기 실행
    fetchAllCoursesForFav("");

    setTimeout(async () => {
        const res = await fetch("/api/courses");
        const data = await res.json();
        if (data.success && data.courses.length >= 3) {
            myFavCourses = data.courses.slice(0, 3);
            renderMyFavCourses();
            renderApplyPageCourses();
        }
    }, 300);
});