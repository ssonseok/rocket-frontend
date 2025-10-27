const urlParams = new URLSearchParams(window.location.search);
const serialNumber = urlParams.get("serial");

if (!serialNumber) {
    alert("URL에 serial 파라미터가 없습니다. 이전 페이지로 돌아갑니다.");
    history.back();
    throw new Error("URL에 serial 파라미터가 없습니다.");
}

// DOM
const deviceSerialInput = document.getElementById("deviceSerial");
const deviceNameInput = document.getElementById("deviceName");
const deviceIPInput = document.getElementById("deviceIP");
const devicePortInput = document.getElementById("devicePort");
const dataSettingsDiv = document.getElementById("dataSettings");
const saveBtn = document.getElementById("saveBtn"); // saveBtn은 type="submit" 버튼을 가정

// 1. GET으로 장치 + 센서 정보 불러오기 (DTO 필드명 매핑)
document.addEventListener("DOMContentLoaded", () => {
    fetchDeviceDetail(serialNumber);
    saveBtn.addEventListener("click", handleModifySubmit);
});

/**
 * 장치 상세 정보를 백엔드에서 불러와 폼을 채웁니다.
 */
function fetchDeviceDetail(serial) {
    // API: GET /api/device/{deviceSerialNumber}
    fetch(`http://localhost:8080/api/device/${serial}`)
        .then(res => {
            if (!res.ok) throw new Error("장치 정보를 불러오지 못했습니다. 서버 상태: " + res.status);
            return res.json();
        })
        .then(data => {
            // ✅ 장치 기본 정보 세팅 (GET 응답 필드명: name, ip, port 사용)
            deviceSerialInput.value = data.deviceSerialNumber || '';
            deviceNameInput.value = data.name || '';
            deviceIPInput.value = data.ip || '';
            devicePortInput.value = data.port || '';

            // 센서 데이터 폼 생성
            if (data.deviceDataList && data.deviceDataList.length > 0) { // dataStreams가 아닌 deviceDataList를 사용한다고 가정
                createDataForm(data.deviceDataList);
            } else {
                dataSettingsDiv.innerHTML = "<p>등록된 센서 데이터가 없습니다.</p>";
            }
        })
        .catch(err => {
            console.error("장치 정보 로드 실패:", err);
            alert("장치 정보 로드 실패: " + err.message);
        });
}

/**
 * 센서 데이터 폼 생성 함수 (DB 값 누락 없이 표시하도록 필드명 매핑)
 * DB에서 온 필드명을 PUT DTO 필드명에 맞춰서 매핑합니다.
 */
function createDataForm(sensorList) {
    dataSettingsDiv.innerHTML = "";

    sensorList.forEach((sensor, index) => {
        const div = document.createElement("div");
        div.className = "sensor-data-row row data-row-item";
        div.style.border = "1px solid #ccc";
        div.style.padding = "5px";
        div.style.margin = "5px 0";

        // DB 값이 null/undefined일 때 빈 문자열로 처리하는 헬퍼 함수
        const val = (field) => (sensor[field] !== undefined && sensor[field] !== null) ? sensor[field] : '';

        // GET 응답 필드명과 PUT DTO 필드명을 비교하여 매핑 (예시: DB 필드명은 dataName, unitName 등이라고 가정)
        // 주의: 이 부분은 DB의 실제 필드명과 PUT DTO의 필드명을 맞춰야 합니다.

        div.innerHTML = `
            <div class="col-1 text-center pt-2">${index + 1}</div>
            <input type="hidden" class="deviceDataId" value="${val('deviceDataId') || ''}">

            <div class="col-3"><input type="text" class="form-control dataName" value="${val('name') || ''}" required></div>

            <div class="col-2">
                <select class="form-select unitName">
                    <option value="${val('unitName') || ''}" selected>${val('unitName') || '단위 선택'}</option>
                    <option value="lux">lux</option>
                    <option value="ppm">ppm</option>
                    <option value="℃">℃</option>
                </select>
            </div>

            <div class="col-2"><input type="number" step="any" class="form-control minValue" value="${val('minValue')}" placeholder="최소"></div>
            <div class="col-2"><input type="number" step="any" class="form-control maxValue" value="${val('maxValue')}" placeholder="최대"></div>
            <div class="col-2"><input type="number" step="any" class="form-control standardValue" value="${val('standardValue')}" placeholder="기준"></div>
        `;
        dataSettingsDiv.appendChild(div);
    });
}

// 수정 저장 이벤트 핸들러 (DTO 통합 및 PUT 요청)
function handleModifySubmit(event) {
    event.preventDefault();

    const deviceName = deviceNameInput.value.trim();
    const deviceIP = deviceIPInput.value.trim();
    const devicePort = devicePortInput.value.trim();

    if (!deviceName || !deviceIP || !devicePort) {
        alert("장치명, IP, Port는 필수 입력값입니다.");
        return;
    }

    // 1. 센서 데이터 수집: Admin_DeviceDataModifyReqDTO 구조에 정확히 매핑
    const dataStreams = [];
    const sensorRows = dataSettingsDiv.querySelectorAll(".sensor-data-row");

    let isDataValid = true;

    sensorRows.forEach(row => {
        const parseNumOrNull = (str) => str ? parseFloat(str) : 0; // 숫자 값은 0으로 보내는 것이 안전할 수 있음

        const dataName = row.querySelector(".dataName").value.trim();
        if (!dataName) {
            isDataValid = false;
            return;
        }

        dataStreams.push({
            deviceDataId: row.querySelector(".deviceDataId").value ? parseInt(row.querySelector(".deviceDataId").value) : 0, // 0을 ID로 보내거나 null로 보냄
            name: dataName,
            unitName: row.querySelector(".unitName").value,
            minValue: parseNumOrNull(row.querySelector(".minValue").value),
            maxValue: parseNumOrNull(row.querySelector(".maxValue").value),
            standardValue: parseNumOrNull(row.querySelector(".standardValue").value),
        });
    });

    if (!isDataValid) {
        alert("모든 센서 데이터의 '값 명칭'을 입력해 주세요.");
        return;
    }

    // 2. Admin_DeviceModifyReqDTO 구조에 맞게 통합 JSON 객체 구성
    const modifyReqDTO = {
        deviceSerialNumber: deviceSerialInput.value,
        newName: deviceName, // ✅ DTO 필드명 newName 사용
        newIpAddress: deviceIP, // ✅ DTO 필드명 newIpAddress 사용
        newPort: Number(devicePort), // ✅ DTO 필드명 newPort 사용
        dataStreams: dataStreams // ✅ DTO 필드명 dataStreams 사용
    };

    // 3. 단일 PUT 요청 전송: /api/device/modify
    fetch("http://localhost:8080/api/device/modify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modifyReqDTO)
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(error => {
                throw new Error(error.message || `HTTP ${res.status} 오류: 서버 응답 오류`);
            });
        }
        return res.json();
    })
    .then(resData => {
        if (resData.updated === true) { // ✅ 응답 DTO 필드에 updated:true 확인
            alert("✅ 장치 정보 및 센서 데이터 수정 완료!");
            location.href = "../deviceList/deviceList.html";
        } else {
            alert("장치 수정 실패: " + (resData.message || "서버에서 업데이트 실패 응답"));
        }
    })
    .catch(err => {
        console.error("최종 수정 요청 오류:", err);
        alert("장치 수정 중 오류 발생! \n사유: " + err.message);
    });
}