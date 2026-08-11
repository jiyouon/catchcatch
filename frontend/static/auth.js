// [API] 로그인 폼 제출 처리
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const userId = document.getElementById("userId").value.trim();
        const password = document.getElementById("password").value;
        const errorDiv = document.getElementById("loginError");

        if (errorDiv) errorDiv.textContent = "";

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId, password: password })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                alert("로그인 성공!");
                // <새로 작성> 로그인 후 대시보드가 아닌 메인 홈 화면('/')으로 이동
                window.location.href = "/";
            } else {
                if (errorDiv) errorDiv.textContent = data.message || "로그인에 실패했습니다.";
            }
        } catch (err) {
            console.error("로그인 요청 에러:", err);
            if (errorDiv) errorDiv.textContent = "서버 통신 중 오류가 발생했습니다.";
        }
    });
}