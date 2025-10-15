document.addEventListener("DOMContentLoaded", () => {
    // 장비 등록
    document.getElementById("btn-device-register").addEventListener("click", () => {
        location.href = "../deviceRegister/deviceRegister.html";
    });

    // 장비 목록 확인
    document.getElementById("btn-device-list").addEventListener("click", () => {
        location.href = "../deviceList/deviceList.html";
    });

    // 회원 관리
    document.getElementById("btn-user-manage").addEventListener("click", () => {
        location.href = "../userManage/userManage.html";
    });
});
