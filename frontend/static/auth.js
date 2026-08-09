// 로그인 폼
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById('loginError');

function validateUserId(userId) {
    if (userId.length < 4 || userId.length > 20) {
        return '아이디는 4자 이상 20자 이하여야 합니다.';
    }
    if (!/^[A-Za-z0-9_]+$/.test(userId)) {
        return '아이디는 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.';
    }
    return '';
}

function validatePassword(password) {
    if (password.length < 8 || password.length > 32) {
        return '비밀번호는 8자 이상 32자 이하여야 합니다.';
    }
    if (/\s/.test(password)) {
        return '비밀번호에 공백 문자를 포함할 수 없습니다.';
    }
    const checks = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/];
    const count = checks.reduce((sum, re) => sum + (re.test(password) ? 1 : 0), 0);
    if (count < 2) {
        return '비밀번호는 영문, 숫자, 특수문자 중 2종류 이상을 포함해야 합니다.';
    }
    return '';
}

function validateStudentId(studentId) {
    if (!/^[0-9]{8,20}$/.test(studentId)) {
        return '학번은 숫자 8~20자리여야 합니다.';
    }
    return '';
}

if (loginForm) {

    // 새로 추가 : 입력 시 말풍선 에러 리셋 이벤트 추가
    const userIdInput = document.getElementById("userId");
    const passwordInput = document.getElementById("password");

    if (userIdInput) {
        userIdInput.addEventListener("input", function () {
            this.setCustomValidity(""); // 새로 추가 : 입력 시 기존 말풍선 초기화
        });
    }
    if (passwordInput) {
        passwordInput.addEventListener("input", function () {
            this.setCustomValidity(""); // 새로 추가 : 입력 시 기존 말풍선 초기화
        });
    }

    loginForm.addEventListener("submit", function (event) {

        //새로고침 방지
        event.preventDefault();

        const userIdInput = document.getElementById("userId");
        const passwordInput = document.getElementById("password");

        if (userIdInput) userIdInput.setCustomValidity("");
        if (passwordInput) passwordInput.setCustomValidity("");

        const userId = userIdInput ? userIdInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value.trim() : "";

        const error = document.getElementById("loginError");

        // 기존 에러메시지 삭제
        if (error) error.textContent = ""; // 새로 추가 : error 요소 존재 확인

        if (userId === "") {
            if (userIdInput) {
                userIdInput.setCustomValidity("아이디를 입력해주세요.");
                userIdInput.focus();
                userIdInput.reportValidity();
            }
            if (error) error.textContent = "아이디를 입력해주세요.";
            return;
        }

        const userIdError = validateUserId(userId);
        if (userIdError) {
            if (userIdInput) {
                userIdInput.setCustomValidity(userIdError);
                userIdInput.focus();
                userIdInput.reportValidity();
            }
            if (error) error.textContent = userIdError;
            return;
        }

        if (password === "") {
            if (passwordInput) {
                passwordInput.setCustomValidity("비밀번호를 입력해주세요.");
                passwordInput.focus();
                passwordInput.reportValidity();
            }
            if (error) error.textContent = "비밀번호를 입력해주세요.";
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            if (passwordInput) {
                passwordInput.setCustomValidity(passwordError);
                passwordInput.focus();
                passwordInput.reportValidity();
            }
            if (error) error.textContent = passwordError;
            return;
        }

        // 로그인 버튼 비활성화
        const submitButton = loginForm.querySelector("button");
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "로그인 중...";
        }

        const rememberMeInput = document.getElementById('rememberMe');
        fetch('/api/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            password: password,
            remember_me: rememberMeInput ? rememberMeInput.checked : false
          })
        })
        .then(function (response) { // 새로 추가 : 응답 객체 처리
          return response.json().then(function (result) {
            return { ok: response.ok, result: result };
          });
        })
        .then(function (data) { // 새로 추가 : 결과 데이터 판별
          if (data.ok && data.result.success) {
            // 로그인 성공 시 시간표 페이지로 이동
            window.location.href = '/dashboard';
          } else {
            const message = data.result.message || '로그인에 실패했습니다.';
            if (loginError) {
                loginError.innerHTML = `${message}<br>계정이 없으신 경우 <strong><a href="/register" class="text-danger underline">회원가입</a></strong>을 진행해 주세요.`;
            }
            if (submitButton) {
                submitButton.disabled = false; // 새로 추가 : 로그인 실패 시 버튼 재활성화
                submitButton.textContent = "로그인"; // 새로 추가 : 버튼 텍스트 복구
            }
          }
        })
        .catch(function (err) { // 새로 추가 : 통신 에러 예외 처리
          if (loginError) {
              loginError.innerHTML = '서버와의 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
          }
          if (submitButton) {
              submitButton.disabled = false; // 새로 추가 : 오류 발생 시 버튼 재활성화
              submitButton.textContent = "로그인"; // 새로 추가 : 버튼 텍스트 복구
          }
        });
    });
}


// 회원가입 폼
const registerForm = document.getElementById("registerForm");

if (registerForm) {

    // 새로 추가 : 회원가입 입력 필드 입력 시 말풍선 에러 리셋 이벤트 등록
    ["userId", "password", "passwordCheck", "studentId", "department"].forEach(function (id) {
        const inputElem = document.getElementById(id);
        if (inputElem) {
            inputElem.addEventListener("input", function () {
                this.setCustomValidity(""); // 새로 추가 : 입력 시 말풍선 초기화
            });
            inputElem.addEventListener("change", function () {
                this.setCustomValidity(""); // 새로 추가 : select 등의 변경 시 초기화
            });
        }
    });

    registerForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const userIdInput = document.getElementById("userId");
        const passwordInput = document.getElementById("password");
        const passwordCheckInput = document.getElementById("passwordCheck");
        const studentIdInput = document.getElementById("studentId");
        const departmentInput = document.getElementById("department");

        if (userIdInput) userIdInput.setCustomValidity("");
        if (passwordInput) passwordInput.setCustomValidity("");
        if (passwordCheckInput) passwordCheckInput.setCustomValidity("");
        if (studentIdInput) studentIdInput.setCustomValidity("");
        if (departmentInput) departmentInput.setCustomValidity("");

        const userId = userIdInput ? userIdInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value.trim() : "";
        const passwordCheck = passwordCheckInput ? passwordCheckInput.value.trim() : "";
        const studentId = studentIdInput ? studentIdInput.value.trim() : "";
        const department = departmentInput ? departmentInput.value : "";

        const error = document.getElementById("registerError");

        // 기존 에러메시지 삭제
        if (error) error.textContent = "";

        if (userId === "") {
            if (userIdInput) {
                userIdInput.setCustomValidity("아이디를 입력해주세요.");
                userIdInput.focus();
                userIdInput.reportValidity();
            }
            if (error) error.textContent = "아이디를 입력해주세요.";
            return;
        }

        const userIdError = validateUserId(userId);
        if (userIdError) {
            if (userIdInput) {
                userIdInput.setCustomValidity(userIdError);
                userIdInput.focus();
                userIdInput.reportValidity();
            }
            if (error) error.textContent = userIdError;
            return;
        }

        if (password === "") {
            if (passwordInput) {
                passwordInput.setCustomValidity("비밀번호를 입력해주세요.");
                passwordInput.focus();
                passwordInput.reportValidity();
            }
            if (error) error.textContent = "비밀번호를 입력해주세요.";
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            if (passwordInput) {
                passwordInput.setCustomValidity(passwordError);
                passwordInput.focus();
                passwordInput.reportValidity();
            }
            if (error) error.textContent = passwordError;
            return;
        }

        if (passwordCheck === "") { // 새로 추가 : 비밀번호 확인 빈 값 검사
            if (passwordCheckInput) {
                passwordCheckInput.setCustomValidity("비밀번호 확인을 입력해주세요.");
                passwordCheckInput.focus(); // 새로 추가 : 포커스 지정
                passwordCheckInput.reportValidity();
            }
            if (error) error.textContent = "비밀번호 확인을 입력해주세요.";
            return;
        }

        if (password !== passwordCheck) {
            if (passwordCheckInput) {
                passwordCheckInput.setCustomValidity("비밀번호가 일치하지 않습니다.");
                passwordCheckInput.focus(); // 새로 추가 : 포커스 지정
                passwordCheckInput.reportValidity();
            }
            if (error) error.textContent = "비밀번호가 일치하지 않습니다.";
            return;
        }

        if (studentId === "") {
            if (studentIdInput) {
                studentIdInput.setCustomValidity("학번을 입력해주세요.");
                studentIdInput.focus();
                studentIdInput.reportValidity();
            }
            if (error) error.textContent = "학번을 입력해주세요.";
            return;
        }

        const studentIdError = validateStudentId(studentId);
        if (studentIdError) {
            if (studentIdInput) {
                studentIdInput.setCustomValidity(studentIdError);
                studentIdInput.focus();
                studentIdInput.reportValidity();
            }
            if (error) error.textContent = studentIdError;
            return;
        }

        if (department === "" || department === "선택") { // 새로 추가 : 학과 선택 유효성 검사
            if (departmentInput) {
                departmentInput.setCustomValidity("학과를 선택해주세요.");
                departmentInput.focus(); // 새로 추가 : 포커스 지정
                departmentInput.reportValidity();
            }
            if (error) error.textContent = "학과를 선택해주세요.";
            return;
        }

        const submitButton = registerForm.querySelector("button");

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "회원가입 중...";
        }

        fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                password: password,
                student_id: studentId,
                department: department
            })
        })
        .then(function (response) {
            return response.json().then(function (result) {
                return { ok: response.ok, result: result };
            });
        })
        .then(function (data) {
            if (data.ok && data.result.success) {
                window.location.href = '/login';
            } else {
                if (error) {
                    error.textContent = data.result.message || '회원가입에 실패했습니다.';
                }
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = "회원가입";
                }
            }
        })
        .catch(function () {
            if (error) {
                error.textContent = '서버와의 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
            }
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "회원가입";
            }
        });
    });

}