const params = new URLSearchParams(window.location.search);
const userId = params.get("userId");

// 사용자 정보 불러오기
fetch(`http://localhost:8080/api/user/${userId}`)
    .then(res => res.json())
    .then(user => {
        document.getElementById("userid").textContent = user.userId;
        document.getElementById("name").textContent = user.name;
        document.getElementById("email").textContent = user.email;
        document.getElementById("tel").textContent = user.tel;
    });

// 삭제 버튼
document.getElementById("delete-btn").addEventListener("click", () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    fetch("http://localhost:8080/api/user/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            alert("삭제 완료");
            location.href = "../userList/userList.html";
        } else {
            alert("삭제 실패: " + data.errorType);
        }
    });
});
