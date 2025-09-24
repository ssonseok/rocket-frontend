document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("user-table-body");

    // 회원 목록 가져오기
    fetch("http://localhost:8080/api/user/list")
        .then(res => res.json())
        .then(users => {
            tableBody.innerHTML = "";

            users.forEach((user, index) => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${user.userId}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.tel}</td>
                    <td><button onclick="modifyUser('${user.userId}')">수정</button></td>
                    <td><button onclick="deleteUser('${user.userId}')">삭제</button></td>
                `;

                tableBody.appendChild(row);
            });
        })
        .catch(err => console.error("회원 목록 불러오기 실패:", err));

});

// 수정 이동
function modifyUser(userId) {
    location.href = `../userModify/userModify.html?userId=${userId}`;
}

// 삭제 이동
function deleteUser(userId) {
    location.href = `../userDelete/userDelete.html?userId=${userId}`;
}
