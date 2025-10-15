const urlParams = new URLSearchParams(window.location.search);
const serialNumber = urlParams.get("serial");

if (!serialNumber) {
    throw new Error("URL에 serial 파라미터가 없습니다.");
}

// DOM
const deviceSerialInput = document.getElementById("deviceSerial");
const deviceNameInput = document.getElementById("deviceName");
const deviceIPInput = document.getElementById("deviceIP");
const devicePortInput = document.getElementById("devicePort");
const dataSettingsDiv = document.getElementById("dataSettings");
const saveBtn = document.getElementById("saveBtn");

// 1. GET으로 장치 + 센서 정보 불러오기
fetch(`http://localhost:8080/api/device/${serialNumber}`)
    .then(res => {
        if (!res.ok) throw new Error("장치 정보를 불러오지 못했습니다.");
        return res.json();
    })
    .then(data => {
        // 장치 기본 정보 세팅
        deviceSerialInput.value = data.deviceSerialNumber;
        deviceNameInput.value = data.name;
        deviceIPInput.value = data.ip;
        devicePortInput.value = data.port;

        // 센서 데이터 폼 생성
        if (data.deviceDataList && data.deviceDataList.length > 0) {
                    createDataForm(data.deviceDataList);
                } else {
                    dataSettingsDiv.innerHTML = "<p>장치 데이터가 없습니다.</p>";
                }
    })
    .catch(err => {
        console.error(err);
        alert(err.message);
    });

// 센서 데이터 폼 생성 함수 (기존 코드 그대로 사용)
function createDataForm(sensorList) {
    dataSettingsDiv.innerHTML = "";

    sensorList.forEach((sensor, index) => {
        const div = document.createElement("div");
        div.style.border = "1px solid #ccc";
        div.style.padding = "5px";
        div.style.margin = "5px 0";

        div.innerHTML = `
            <h3>${index + 1}번째 데이터</h3>
            단위: <select class="unitSelect">
                <option value="1" ${sensor.unitId === 1 ? "selected" : ""}>lux</option>
                <option value="2" ${sensor.unitId === 2 ? "selected" : ""}>ppm</option>
                <option value="3" ${sensor.unitId === 3 ? "selected" : ""}>℃</option>
            </select>
            최소값: <input type="number" class="minVal" value="${sensor.min}">
            최대값: <input type="number" class="maxVal" value="${sensor.max}">
            기준값: <input type="number" class="refVal" value="${sensor.referenceValue}">
            명칭: <input type="text" class="dataName" value="${sensor.name}">
        `;
        dataSettingsDiv.appendChild(div);
    });
}

// 수정 저장 이벤트도 serialNumber 사용
saveBtn.addEventListener("click", () => {
    const updatedDevice = {
        deviceSerialNumber: deviceSerialInput.value,
        name: deviceNameInput.value.trim(),
        ip: deviceIPInput.value.trim(),
        port: Number(devicePortInput.value)
    };

    const sensorData = [];
    dataSettingsDiv.querySelectorAll("div").forEach(div => {
        sensorData.push({
            name: div.querySelector(".dataName").value.trim(),
            min: Number(div.querySelector(".minVal").value),
            max: Number(div.querySelector(".maxVal").value),
            referenceValue: Number(div.querySelector(".refVal").value),
            unitId: Number(div.querySelector(".unitSelect").value)
        });
    });

    // 1) 장치 정보 수정
    fetch("http://localhost:8080/api/device/modify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDevice)
    })
    .then(res => res.json())
    .then(resData => {
        if (resData.status === "success") {
            // 2) 센서 데이터 수정
            fetch(`http://localhost:8080/api/device/${serialNumber}/deviceData/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sensorData)
            })
            .then(res => res.json())
            .then(() => alert("장치 + 센서 데이터 수정 완료!"))
            .catch(err => {
                console.error(err);
                alert("센서 데이터 수정 실패!");
            });
        } else {
            alert("장치 수정 실패");
        }
    })
    .catch(err => {
        console.error(err);
        alert("장치 수정 중 오류 발생!");
    });
});



