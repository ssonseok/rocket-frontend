// URL에서 userId 가져오기
const params = new URLSearchParams(window.location.search);
const userId = params.get("userId");

if (!userId) {
    alert("userId가 URL에 없습니다.");
    throw new Error("userId가 URL에 없습니다.");
}

// 회원 정보 가져오기
fetch(`http://localhost:8080/api/user/${userId}`)
    .then(res => res.json())
    .then(user => {
        console.log("받은 user 객체:", user); // 확인용

        // JSON 구조가 { userId, name, email, tel } 이어야 함
        document.getElementById("userid").value = user.userId || user.userid || "";
        document.getElementById("name").value = user.name || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("tel").value = user.tel || "";
    })
    .catch(err => {
        console.error("회원 정보 불러오기 실패:", err);
        alert("회원 정보를 불러올 수 없습니다.");
    });

// 수정 버튼 클릭
document.getElementById("modify-btn").addEventListener("click", () => {
    const dto = {
        userId: document.getElementById("userid").value,
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        tel: document.getElementById("tel").value
    };

    fetch("http://localhost:8080/api/user/modify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dto)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "success") {
            alert("수정 완료");
            location.href = "../userList/userList.html"; // 목록 페이지로 이동
        } else {
            alert("수정 실패: " + data.errorType);
        }
    })
    .catch(err => {
        console.error("수정 요청 실패:", err);
        alert("서버와 통신 중 오류가 발생했습니다.");
    });
});
