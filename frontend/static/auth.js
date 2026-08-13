document.addEventListener("DOMContentLoaded", function () {
    
    // [API] 로그인 폼 제출 처리
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // HTML input ID가 userId 또는 user_id인 경우 모두 대응
            const userIdInput = document.getElementById("userId") || document.getElementById("user_id");
            const passwordInput = document.getElementById("password");
            const errorDiv = document.getElementById("loginError");

            const userId = userIdInput ? userIdInput.value.trim() : "";
            const password = passwordInput ? passwordInput.value : "";

            if (errorDiv) errorDiv.textContent = "";

            if (!userId || !password) {
                const msg = "아이디와 비밀번호를 모두 입력해 주세요.";
                if (errorDiv) errorDiv.textContent = msg;
                else alert(msg);
                return;
            }

            try {
                const res = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin", // 세션 쿠키 전달
                    body: JSON.stringify({ user_id: userId, password: password })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    alert("로그인 성공!");
                    // 로그인 후 메인 홈 화면('/')으로 이동
                    window.location.href = "/";
                } else {
                    const failMsg = data.message || "로그인에 실패했습니다.";
                    if (errorDiv) errorDiv.textContent = failMsg;
                    else alert("⚠️ " + failMsg);
                }
            } catch (err) {
                console.error("로그인 요청 에러:", err);
                const errMsg = "서버 통신 중 오류가 발생했습니다.";
                if (errorDiv) errorDiv.textContent = errMsg;
                else alert("🚨 " + errMsg);
            }
        });
    }


    // [API] 회원가입 폼 제출 처리
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            // 입력 필드 참조 (HTML id에 맞춰 참조)
            const userIdInput = document.getElementById("user_id") || document.getElementById("userId");
            const passwordInput = document.getElementById("password");
            const passwordConfirmInput = document.getElementById("password_confirm");
            const studentIdInput = document.getElementById("student_id") || document.getElementById("studentId");
            const departmentInput = document.getElementById("department");

            const userId = userIdInput ? userIdInput.value.trim() : "";
            const password = passwordInput ? passwordInput.value : "";
            const passwordConfirm = passwordConfirmInput ? passwordConfirmInput.value : undefined;
            const studentId = studentIdInput ? studentIdInput.value.trim() : "";
            const department = departmentInput ? departmentInput.value : "";

            // --- [프론트엔드 유효성 검사] ---
            if (!userId || !password || !studentId || !department) {
                alert("⚠️ 모든 필수 정보를 입력해 주세요.");
                return;
            }

            // 1) 아이디 검사: 4~20자, 영문/숫자/밑줄(_)
            const idRegex = /^[A-Za-z0-9_]{4,20}$/;
            if (!idRegex.test(userId)) {
                alert("⚠️ 아이디는 4~20자의 영문, 숫자, 밑줄(_)만 사용 가능합니다.");
                return;
            }

            // 2) 비밀번호 검사: 8~32자, 공백 불가, 영문/숫자/특수문자 중 2가지 이상 조합
            if (password.length < 8 || password.length > 32 || /\s/.test(password)) {
                alert("⚠️ 비밀번호는 공백 없이 8~32자여야 합니다.");
                return;
            }

            let categories = 0;
            if (/[a-z]/.test(password)) categories++;
            if (/[A-Z]/.test(password)) categories++;
            if (/[0-9]/.test(password)) categories++;
            if (/[^A-Za-z0-9]/.test(password)) categories++;

            if (categories < 2) {
                alert("⚠️ 비밀번호는 영문 대/소문자, 숫자, 특수문자 중 2가지 이상을 조합해야 합니다.");
                return;
            }

            // 비밀번호 확인 일치 체크
            if (passwordConfirm !== undefined && password !== passwordConfirm) {
                alert("⚠️ 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
                return;
            }

            // 3) 학번 검사: 숫자 8~20자리
            const studentIdRegex = /^[0-9]{8,20}$/;
            if (!studentIdRegex.test(studentId)) {
                alert("⚠️ 학번은 8~20자리의 숫자로 입력해 주세요.");
                return;
            }

            // --- [API 요청] ---
            try {
                const response = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: userId,
                        password: password,
                        student_id: studentId,
                        department: department
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert("🎉 회원가입이 완료되었습니다! 로그인해 주세요.");
                    // 가입 성공 후 로그인 페이지('/login')로 이동
                    window.location.href = "/login";
                } else {
                    alert("⚠️ " + (result.message || "회원가입에 실패했습니다."));
                }
            } catch (error) {
                console.error("회원가입 요청 중 오류 발생:", error);
                alert("🚨 서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
            }
        });
    }
});