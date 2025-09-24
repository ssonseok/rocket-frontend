document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const dto = {
            userId: document.getElementById("userid").value,
            pw: document.getElementById("pw").value,
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            tel: document.getElementById("tel").value,
            permission: 0
        };

        if (dto.pw !== document.getElementById("pwConfirm").value) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        fetch("http://localhost:8080/api/user/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dto)
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                alert("회원 등록 완료!");
                location.href = "../userManage/userManage.html";
            } else {
                alert("등록 실패: " + data.errorType);
            }
        })
        .catch(err => console.error("등록 에러:", err));
    });
});
