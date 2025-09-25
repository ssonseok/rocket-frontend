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

function deleteDevice(serial, name) {
    if (confirm(`장치 "${name}" (시리얼: ${serial}) 을/를 정말 삭제하시겠습니까?`)) {
        fetch("http://localhost:8080/api/device/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                deviceSerialNumber: serial,
                name: name
            })
        })
        .then(res => {
            if (!res.ok) throw new Error("삭제 실패");
            return res.json();
        })
        .then(data => {
            if (data.status === "success") {
                alert("삭제 완료!");
                location.reload(); // ✅ 목록 페이지 새로고침
            } else {
                alert("삭제 실패: " + (data.errorType || "알 수 없는 오류"));
            }
        })
        .catch(err => {
            console.error(err);
            alert("삭제 중 오류 발생!");
        });
    }
}

function statusDevice(serial) {
    location.href = `../deviceStatus/deviceStatus.html?serial=${serial}`;
}
