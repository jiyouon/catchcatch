async function loadGraduationStatus() {
    const totalText = document.getElementById("totalProgressText");
    const majorText = document.getElementById("majorProgressText");
    const generalText = document.getElementById("generalProgressText");
    const careerText = document.getElementById("careerProgressText");

    const totalBar = document.getElementById("totalProgressBar");
    const majorBar = document.getElementById("majorProgressBar");
    const generalBar = document.getElementById("generalProgressBar");
    const careerBar = document.getElementById("careerProgressBar");

    const graduationStatus = document.getElementById("graduationStatus");
    const swRequirement = document.getElementById("swRequirement");
    const coreDomainRequirement = document.getElementById("coreDomainRequirement");
    const warningList = document.getElementById("graduationWarnings");

    try {
        const response = await fetch("/api/graduation-check", {
            method: "GET",
            credentials: "same-origin"
        });

        if (response.status === 401) {
            if (graduationStatus) {
                graduationStatus.textContent = "로그인 필요";
                graduationStatus.className = "badge bg-secondary";
            }
            return;
        }

        const data = await response.json();
        if (!response.ok || !data.success) return;

        const p = data.progress;
        const sw = data.sw_info;
        const core = data.core_info;

        // [1] 프로그레스 바 반영
        if (totalText) totalText.textContent = `${p.current_total} / ${p.req_total}학점 (${p.total_percent}%)`;
        if (totalBar) { totalBar.style.width = `${Math.min(p.total_percent, 100)}%`; totalBar.textContent = `${p.total_percent}%`; }

        if (majorText) majorText.textContent = `${p.current_major} / ${p.req_major}학점 (${p.major_percent}%)`;
        if (majorBar) { majorBar.style.width = `${Math.min(p.major_percent, 100)}%`; majorBar.textContent = `${p.major_percent}%`; }

        if (generalText) generalText.textContent = `${p.current_general} / ${p.req_general}학점 (${p.general_percent}%)`;
        if (generalBar) { generalBar.style.width = `${Math.min(p.general_percent, 100)}%`; generalBar.textContent = `${p.general_percent}%`; }

        if (careerText) careerText.textContent = `${p.current_career} / ${p.req_career}학점 (${p.career_percent}%)`;
        if (careerBar) { careerBar.style.width = `${Math.min(p.career_percent, 100)}%`; careerBar.textContent = `${p.career_percent}%`; }

        // [2] 학과별 SW 필수 교양 상세 안내
        if (swRequirement) {
            if (sw.taken) {
                swRequirement.innerHTML = `<span class="text-success fw-bold">${sw.msg}</span>`;
            } else {
                let btnHtml = sw.keyword 
                    ? `<a href="/dashboard" class="btn btn-outline-primary btn-sm mt-2">🔍 [${sw.keyword}] 개설 강의 확인하기</a>` 
                    : '';
                swRequirement.innerHTML = `
                    <div class="text-danger fw-bold mb-1">${sw.msg}</div>
                    ${btnHtml}
                `;
            }
        }

        // [3] 학과별 핵심교양 및 지정 과목 안내
        if (coreDomainRequirement) {
            let coreMsg = `이수 핵심교양 영역: <strong>${core.current_domains}</strong> / 필요 ${core.req_domains}개 영역`;
            let specMsg = core.specified ? `<div class="text-primary small mt-1">📌 학과 지정 교양: <strong>${core.specified}</strong></div>` : '';
            let specBtn = `<a href="/dashboard" class="btn btn-outline-info btn-sm mt-2">🔍 지정 교양 과목 개설 현황 확인</a>`;

            coreDomainRequirement.innerHTML = `
                <div>${coreMsg}</div>
                ${specMsg}
                ${specBtn}
            `;
        }

        // [4] 졸업 판정 뱃지
        if (graduationStatus) {
            graduationStatus.textContent = data.is_qualified ? "졸업요건 충족" : "미충족";
            graduationStatus.className = data.is_qualified ? "badge bg-success" : "badge bg-warning text-dark";
        }

        // [5] 경고 리스트
        if (warningList) {
            warningList.innerHTML = "";
            if (!data.warnings || data.warnings.length === 0) {
                warningList.innerHTML = `<div class="text-success fw-bold">✓ 현재 소속 학과(${data.department})의 졸업요건을 모두 충족했습니다!</div>`;
            } else {
                data.warnings.forEach(warning => {
                    const item = document.createElement("div");
                    item.className = "text-danger mb-1";
                    item.textContent = `⚠ ${warning}`;
                    warningList.appendChild(item);
                });
            }
        }

    } catch (error) {
        console.error("졸업요건 데이터 로드 실패:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadGraduationStatus);