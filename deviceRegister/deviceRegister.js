
const deviceNameInput = document.getElementById("deviceName");
const deviceSerialInput = document.getElementById("deviceSerial");

const edgeSerialInput = document.getElementById("edgeSerial");
const portPathInput = document.getElementById("portPath");

const registerBtn = document.getElementById("registerDeviceBtn");
const dataSettingsDiv = document.getElementById("dataSettings");
const finalRegisterBtn = document.getElementById("finalRegisterBtn");

let serialNumber = "";
let dataCount = 0;
let isDataReady = false;

finalRegisterBtn.disabled = true;
registerBtn.textContent = "장비 등록 및 연결 테스트"; // 초기 텍스트 설정

function createDataForm(count) {
    // ... (함수 내부 로직 유지) ...
    dataSettingsDiv.innerHTML = "<h2>센서 데이터 설정 (총 " + count + "개)</h2>";
    for (let i = 0; i < count; i++) {
        const div = document.createElement("div");
        div.style.border = "1px solid #ccc";
        div.style.padding = "10px";
        div.style.margin = "10px 0";
        div.innerHTML = `
            <h3>${i + 1}번째 데이터</h3>
            <label>명칭: <input type="text" class="dataName" placeholder="데이터 이름 (필수)"></label><br>
            <label>단위:
                <select class="unitSelect">
                    <option value="1">lux</option>
                    <option value="2">ppm</option>
                    <option value="3">℃</option>
                </select>
            </label><br>
            <label>최소값: <input type="number" class="minVal" placeholder="최소값" value="0"></label><br>
            <label>최대값: <input type="number" class="maxVal" placeholder="최대값" value="1000"></label><br>
            <label>기준값: <input type="number" class="refVal" placeholder="기준값" value="0"></label>
        `;
        dataSettingsDiv.appendChild(div);
    }
    finalRegisterBtn.disabled = false;
    registerBtn.textContent = "연결 완료";
    registerBtn.disabled = true;
    isDataReady = true;
}

async function registerAndCheckData(serial, name, edgeSerial, portPath) {
    registerBtn.disabled = true;

    try {
        const res = await fetch("http://localhost:8080/api/device/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                deviceSerialNumber: serial,
                name: name,
                // 🛠️ EdgeSerial과 PortPath 사용
                edgeSerial: edgeSerial,
                portPath: portPath
            })
        });

        const data = await res.json();
        registerBtn.disabled = false;

        if (!res.ok || (data.status !== "success" && data.status !== "pending")) {
            // 실패: 중복, 연결 실패, 또는 외래 키(Edge Serial 미등록) 오류
            const errorMsg = data.errorType || data.message || "알 수 없는 오류";
            alert(` 장치 등록/연결 실패: ${errorMsg}`);
            registerBtn.textContent = "재시도";
            return;
        }

        serialNumber = serial;

        if (data.status === "success" && data.device.dataCount > 0) {
            // ✅ 성공: 데이터까지 확보 완료, 폼 생성
            alert(" 장치 연결 및 데이터 수신 성공!");
            dataCount = data.device.dataCount;
            createDataForm(dataCount);

        } else if (data.status === "pending") {
            // ⏳ 대기: 엣지 연결은 됐으나 데이터 대기 중
            alert(" 엣지 연결 성공. 센서 데이터 수신 대기 중입니다. '데이터 확인'을 다시 눌러 확인해주세요.");
            dataSettingsDiv.innerHTML = "<p>엣지 연결 성공. 센서 데이터 수신을 위해 잠시 기다려주세요. **데이터 확인** 버튼을 다시 눌러 확인해주세요.</p>";
            // ✨ 다음 클릭부터는 재시도 API를 호출하도록 텍스트 변경
            registerBtn.textContent = "데이터 확인";
        }

    } catch (err) {
        console.error("통신 오류:", err);
        registerBtn.disabled = false;
        registerBtn.textContent = "통신 오류 (재시도)";
        alert("장치 등록 요청 중 통신 오류 발생");
    }
}

async function checkDataStatusOnly(serial) {
    registerBtn.disabled = true;

    try {
        const res = await fetch(`http://localhost:8080/api/device/${serial}/data-status`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();
        registerBtn.disabled = false;

        if (data.status === "success" && data.dataCount > 0) {
            // ✅ 데이터 확보 완료 -> 폼 생성
            alert(" 데이터 수신 완료! 동적 폼을 생성합니다.");
            dataCount = data.dataCount;
            createDataForm(dataCount);
            return true;

        } else if (data.status === "pending") {
            // ⏳ 데이터 대기 중
            alert("⏳ 데이터 수신 대기 중입니다. 잠시 후 다시 확인해주세요.");
            registerBtn.textContent = "데이터 확인"; // 텍스트 유지
            return false;

        } else {
             // 실패: 장치 없음, 연결 끊김 등
             alert(` 데이터 확인 실패: ${data.message || data.errorType}`);
             registerBtn.textContent = "재시도";
             return false;
        }

    } catch (err) {
        console.error("데이터 확인 중 오류:", err);
        registerBtn.disabled = false;
        alert("데이터 확인 중 통신 오류 발생");
        return false;
    }
}


registerBtn.addEventListener("click", async () => {
    const deviceName = deviceNameInput.value.trim();
    const serial = deviceSerialInput.value.trim();

    const edgeSerial = edgeSerialInput.value.trim();
    const portPath = portPathInput.value.trim();

    if (!deviceName || !serial || !edgeSerial || !portPath) { // 🛠️ 유효성 검사 수정
        alert("모든 필수 장치 정보를 입력해주세요.");
        return;
    }

    if (isDataReady) {
        alert("센서 데이터 설정이 완료되어 최종 등록만 남았습니다.");
        return;
    }

    // A. 텍스트가 '데이터 확인'인 경우 -> 재시도 로직 실행 (GET API 호출)
    if (registerBtn.textContent.includes("데이터 확인")) {
        if (!serialNumber) {
            alert("장치 등록 과정에 문제가 발생했습니다. 처음부터 다시 시도해주세요.");
            registerBtn.textContent = "재시도";
            return;
        }
        await checkDataStatusOnly(serialNumber);
        return;
    }

    // B. 그 외의 경우 (첫 번째 등록 시도) -> 등록 로직 실행 (POST API 호출)
    await registerAndCheckData(serial, deviceName, edgeSerial, portPath);
});

finalRegisterBtn.addEventListener("click", async () => {
    if (finalRegisterBtn.disabled || !isDataReady) {
        alert("먼저 장치 연결을 완료하고 센서 데이터를 확보해야 합니다.");
        return;
    }

    const dataList = [];
    const dataDivs = dataSettingsDiv.querySelectorAll("div");

    // 데이터 수집
    dataDivs.forEach(div => {
        const unitId = Number(div.querySelector(".unitSelect").value);
        const min = Number(div.querySelector(".minVal").value);
        const max = Number(div.querySelector(".maxVal").value);
        const ref = Number(div.querySelector(".refVal").value);
        const name = div.querySelector(".dataName").value.trim();
        if (name) {
            dataList.push({ name, min, max, referenceValue: ref, unitId });
        }
    });

    if (dataList.length !== dataCount) {
         // 실제 DB에 업데이트할 데이터 개수가 센서 개수와 다름을 경고
         alert(`경고: ${dataCount}개의 센서 중 ${dataList.length}개만 등록됩니다. 모든 센서의 명칭을 입력했는지 확인하세요.`);
    }

    try {
        const res = await fetch(`http://localhost:8080/api/device/${serialNumber}/deviceData/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataList)
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.message || "데이터 등록 실패");
        }

        alert(" 장치 데이터 최종 등록 완료! 실시간 측정이 시작됩니다.");
        finalRegisterBtn.disabled = true;
        // 최종 등록 후, 홈으로 이동 등의 액션 필요
        // window.location.href = "/home";

    } catch (err) {
        console.error(err);
        alert("데이터 등록 실패! 상세: " + err.message);
    }
});