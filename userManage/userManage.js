document.addEventListener("DOMContentLoaded", () => {
    // 회원 등록
    document.getElementById("btn-user-register").addEventListener("click", () => {
        location.href = "../userRegister/userRegister.html";
    });

    // 회원 목록 보기
    document.getElementById("btn-user-list").addEventListener("click", () => {
        location.href = "../userList/userList.html";
    });

});
