document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("device-table-body");

    // 장비 목록 가져오기 (GET /api/device/list)
    fetch("http://localhost:8080/api/device/list")
        .then(res => res.json())
        .then(devices => {
            tableBody.innerHTML = "";

            devices.forEach((device, index) => {
                const createdDate = device.createdDate.split("T")[0]; // YYYY-MM-DD
                const dataList = device.dataNames.length > 0 ? device.dataNames.join(", ") : "없음";

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${device.deviceName}</td>
                    <td>${device.deviceSerialNumber}</td>
                    <td>${createdDate}</td>
                    <td>${dataList}</td>
                    <td><button class="btn btn-success btn-sm" onclick="modifyDevice('${device.deviceSerialNumber}')">수정</button></td>
                    <td><button class="btn btn-danger btn-sm" onclick="deleteDevice('${device.deviceSerialNumber}', '${device.deviceName}')">삭제</button></td>
                    <td><button class="btn btn-primary btn-sm" onclick="statusDevice('${device.deviceSerialNumber}')">상태보기</button></td>

                `;
                tableBody.appendChild(row);
            });
        })
        .catch(err => console.error("장비 목록 불러오기 실패:", err));
});

// 버튼 클릭 함수 (수정)
function modifyDevice(serial) {
    location.href = `../deviceModify/deviceModify.html?serial=${serial}`;
}

// 버튼 클릭 함수 (삭제) - DELETE API 경로 변경 반영
function deleteDevice(serial, name) {
    if (confirm(`장치 "${name || serial}" (시리얼: ${serial}) 을/를 정말 삭제하시겠습니까?`)) {
        // 경로 변수 방식: /api/device/{deviceSerialNumber}
        fetch(`http://localhost:8080/api/device/${serial}`, {
            method: "DELETE"
        })
        .then(res => {
            if (!res.ok) {
                // 서버에서 보낸 오류 메시지 텍스트를 받아서 throw
                return res.text().then(text => { throw new Error(text || "삭제 실패"); });
            }
            return res.text();
        })
        .then(msg => {
            alert("삭제 완료!");
            location.reload();
        })
        .catch(err => {
            console.error("삭제 실패:", err);
            alert("삭제 중 오류 발생! \n" + err.message);
        });
    }
}

// 버튼 클릭 함수 (상태보기)
function statusDevice(serial) {
    location.href = `../deviceStatus/deviceStatus.html?serial=${serial}`;
}
