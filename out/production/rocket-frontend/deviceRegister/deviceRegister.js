const deviceNameInput = document.getElementById("deviceName");
const deviceSerialInput = document.getElementById("deviceSerial");
const deviceIPInput = document.getElementById("deviceIP");
const devicePortInput = document.getElementById("devicePort");

const registerBtn = document.getElementById("registerDeviceBtn");
const dataSettingsDiv = document.getElementById("dataSettings");
const testBtn = document.getElementById("testBtn");
const finalRegisterBtn = document.getElementById("finalRegisterBtn");

let serialNumber = "";
let testPassed = false;

// 1. 장치 등록
registerBtn.addEventListener("click", () => {
    const deviceName = deviceNameInput.value.trim();
    const serial = deviceSerialInput.value.trim();
    const ip = deviceIPInput.value.trim();
    const port = devicePortInput.value.trim();

    if (!deviceName || !serial || !ip || !port) {
        alert("모든 장치 정보를 입력해주세요.");
        return;
    }

    fetch("http://localhost:8080/api/device/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            deviceSerialNumber: serial,
            name: deviceName,
            ip: ip,
            port: Number(port)
        })
    })
    .then(res => {
        if (!res.ok) throw new Error("장치 등록 실패");
        return res.json();
    })
    .then(data => {
        alert("장치 연결 성공");
        serialNumber = serial;

        // 여기서 장치 데이터 개수 받아와야 함
        // 임시로 3개 mock
        const dataCount = 3;
        createDataForm(dataCount);
        testBtn.disabled = false;
    })
    .catch(err => {
        console.error(err);
        alert("장치 연결 실패");
    });
});

// 2. 데이터 폼 생성
function createDataForm(count) {
    dataSettingsDiv.innerHTML = "";
    for (let i = 1; i <= count; i++) {
        const div = document.createElement("div");
        div.style.border = "1px solid #ccc";
        div.style.padding = "5px";
        div.style.margin = "5px 0";
        div.innerHTML = `
            <h3>${i}번째 데이터</h3>
            단위: <select class="unitSelect">
                <option value="1">lux</option>
                <option value="2">ppm</option>
                <option value="3">℃</option>
            </select>
            최소값: <input type="number" class="minVal">
            최대값: <input type="number" class="maxVal">
            기준값: <input type="number" class="refVal">
            명칭: <input type="text" class="dataName">
        `;
        dataSettingsDiv.appendChild(div);
    }
}

// 3. 테스트 버튼
testBtn.addEventListener("click", () => {
    // 실제 테스트 로직 필요 → 일단 mock 성공
    testPassed = true;
    alert("테스트 성공!");
    finalRegisterBtn.disabled = false;
});

// 4. 최종 등록
finalRegisterBtn.addEventListener("click", () => {
    if (!testPassed) {
        alert("테스트를 먼저 통과해야 합니다.");
        return;
    }

    const dataList = [];
    const dataDivs = dataSettingsDiv.querySelectorAll("div");

    dataDivs.forEach(div => {
        const unitId = Number(div.querySelector(".unitSelect").value);
        const min = Number(div.querySelector(".minVal").value);
        const max = Number(div.querySelector(".maxVal").value);
        const ref = Number(div.querySelector(".refVal").value);
        const name = div.querySelector(".dataName").value.trim();

        dataList.push({ name, min, max, referenceValue: ref, unitId });
    });

    fetch(`http://localhost:8080/api/device/${serialNumber}/deviceData/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataList)
    })
    .then(res => {
        if (!res.ok) throw new Error("데이터 등록 실패");
        return res.json();
    })
    .then(result => {
        alert("장치 데이터 최종 등록 완료!");
    })
    .catch(err => {
        console.error(err);
        alert("데이터 등록 실패!");
    });
});
