// deviceRegister.js

$(document).ready(function () {
  const API_HOST = "http://localhost:8080";

  const unitList = [
      { id: 1, name: "lux", display: "Lux (조도)" },
      { id: 2, name: "ppm", display: "ppm (농도)" },
      { id: 3, name: "℃", display: "℃ (온도)" }
      // 필요한 다른 단위가 있다면 여기에 추가
  ];

  const $registerBtn = $("#registerDeviceBtn");
  const $finalBtn = $("#finalRegisterBtn");
  const $dataSettings = $("#dataSettings");
  const $addSensorBtn = $("#addSensorBtn");

  // 🚨 2. fetchUnitList 함수는 제거하거나 호출을 주석 처리합니다.
  // async function fetchUnitList() { ... }
  // fetchUnitList(); // 이 호출을 제거하여 API 오류를 방지합니다.

  // 2. 장치 연결 테스트 및 센서 폼 생성
  $registerBtn.click(async function () {
    const deviceName = $("#deviceName").val().trim();
    const deviceSerial = $("#deviceSerial").val().trim();
    const ip = $("#ip").val().trim();
    const port = $("#port").val().trim();

    // ... (유효성 검사 및 버튼 비활성화 로직 생략) ...
    $registerBtn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> 테스트 중...');
    $finalBtn.prop("disabled", true);
    $dataSettings.html('<p class="text-muted text-center mb-0">연결 테스트 중...</p>');
    $addSensorBtn.hide();

    try {
      // ... (중복 체크 fetch) ...

      const verifyResp = await fetch(`${API_HOST}/api/device/registration/verify-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edgeIp: ip, edgePort: Number(port), deviceSerial: deviceSerial })
      });

      if (!verifyResp.ok) throw new Error("연결 테스트 실패");

      const result = await verifyResp.json();
      const count = result.data ? result.data.dataStreamCount : 0;

      if (!count || count <= 0) {
        alert("연결은 성공했지만, Edge Gateway로부터 센서 데이터 개수를 받지 못했습니다. 수동 추가 기능을 이용하세요.");
        $dataSettings.html('<p class="text-danger text-center mb-0">센서 데이터 개수 확인 실패.</p>');
        $addSensorBtn.show();
        return;
      }

      alert(`✅ 연결 성공! 센서 데이터 ${count}개를 불러왔습니다.`);
      $dataSettings.empty();
      renderSensorForms(count); // 센서 폼 생성
      $finalBtn.prop("disabled", false);
      $addSensorBtn.show();

    } catch (err) {
      console.error(err);
      alert("❌ 연결 테스트 중 오류가 발생했습니다. 장치 정보 및 콘솔을 확인하세요.");
      $dataSettings.html('<p class="text-danger text-center mb-0">테스트 실패. 장치 정보를 확인하세요.</p>');
    } finally {
      $registerBtn.prop("disabled", false).html('<i class="fas fa-link me-2"></i> 장치 연결 테스트');
    }
  });


  // 3. 센서 입력 폼 생성 함수 (하드코딩된 목록 사용)
  function renderSensorForms(count) {
    const startCount = $dataSettings.find('.data-setting-item').length;

    // 🚨 unit.name (DB 'unit' 필드 값)을 Select box의 value로 사용
    const unitOptions = unitList.map(unit =>
        `<option value="${unit.name}">${unit.display} (${unit.name})</option>`
    ).join('');

    for (let i = startCount + 1; i <= count; i++) {
      const streamIndex = i - 1;

      const item = `
        <div class="data-setting-item" data-stream-index="${streamIndex}">
          <h5>센서 #${i} (Index: ${streamIndex})</h5>
          <label class="form-label">이름</label>
          <input type="text" class="form-control sensor-name" placeholder="예: 온도 센서" value="센서 ${i}" required>
          <label class="form-label mt-2">최소값</label>
          <input type="number" class="form-control sensor-min" placeholder="0" value="0">
          <label class="form-label mt-2">최대값</label>
          <input type="number" class="form-control sensor-max" placeholder="1000" value="1000">
          <label class="form-label mt-2">기준값</label>
          <input type="number" class="form-control sensor-ref" placeholder="0" value="0">

          <label class="form-label mt-2">단위 선택</label>
          <select class="form-select sensor-unit-name" required>
            <option value="">단위를 선택하세요</option>
            ${unitOptions}
          </select>
        </div>`;
      $dataSettings.append(item);
    }
  }

  // '센서 추가' 버튼 클릭 핸들러
  $addSensorBtn.click(function() {
      const currentCount = $dataSettings.find('.data-setting-item').length;
      renderSensorForms(currentCount + 1);
      $finalBtn.prop("disabled", false);
  });


  // 4. 최종 등록
  $finalBtn.click(async function () {
    const deviceName = $("#deviceName").val().trim();
    const deviceSerial = $("#deviceSerial").val().trim();
    const ip = $("#ip").val().trim();
    const port = $("#port").val().trim();

    $finalBtn.prop("disabled", true).html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> 등록 중...');

    const sensors = [];
    let isValid = true;

    $(".data-setting-item").each(function (idx) {
      const streamIndex = Number($(this).data('stream-index'));
      const name = $(this).find(".sensor-name").val().trim();
      // 🚨 Select box의 value (unit.name, 예: "lux")를 가져와서 unitName 필드에 매핑
      const unitName = $(this).find(".sensor-unit-name").val();

      if (!name || !unitName) {
          isValid = false;
          return false;
      }

      sensors.push({
        streamIndex: streamIndex,
        name: name,
        unitName: unitName, // 백엔드 DTO에 unitName 문자열 전송
        minValue: Number($(this).find(".sensor-min").val()),
        maxValue: Number($(this).find(".sensor-max").val()),
        standardValue: Number($(this).find(".sensor-ref").val()),
      });
    });

    if (!isValid) {
      alert("모든 센서 이름과 단위를 필수로 선택해야 합니다.");
      $finalBtn.prop("disabled", false).html('<i class="fas fa-check-circle me-2"></i> 최종 등록');
      return;
    }

    try {
      const resp = await fetch(`${API_HOST}/api/device/registration/finalize-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceName,
          deviceSerial,
          edgeIp: ip,
          edgePort: Number(port),
          edgeSerial: deviceSerial,
          dataStreams: sensors
        })
      });

      if (!resp.ok) throw new Error("등록 실패: 서버 응답 문제");

      const result = await resp.json();
      if (result.status === 'success') {
          alert("✅ 장비 등록이 완료되었습니다!");
          window.location.href = "../deviceList/deviceList.html";
      } else {
          throw new Error(result.message || "서버 응답 오류");
      }

    } catch (err) {
      console.error(err);
      alert("❌ 최종 등록 중 오류가 발생했습니다: " + err.message);
    } finally {
      $finalBtn.prop("disabled", false).html('<i class="fas fa-check-circle me-2"></i> 최종 등록');
    }
  });
});