document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("device-table-body");

    // 장비 목록 가져오기
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
                    <td><button onclick="modifyDevice('${device.deviceSerialNumber}')">수정</button></td>
                    <td><button onclick="deleteDevice('${device.deviceSerialNumber}')">삭제</button></td>
                    <td><button onclick="statusDevice('${device.deviceSerialNumber}')">상태보기</button></td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(err => console.error("장비 목록 불러오기 실패:", err));
});

// 버튼 클릭 함수
function modifyDevice(serial) {
    location.href = `../deviceModify/deviceModify.html?serial=${serial}`;
}

function deleteDevice(serial) {
    location.href = `../deviceDelete/deviceDelete.html?serial=${serial}`;
}

function statusDevice(serial) {
    location.href = `../deviceStatus/deviceStatus.html?serial=${serial}`;
}
