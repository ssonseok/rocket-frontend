const API_BASE_URL = "/api/device";
const API_HOST = "http://localhost:8080";

let deviceSerialNumber = null;

// --- DOM Elements ---
const deviceNameEl = document.getElementById('deviceName');
const deviceSerialEl = document.getElementById('deviceSerial');

// 💡 Admin_DeviceStatusRespDTO 필드 매핑
const dbStatusEl = document.getElementById('dbStatus');
const wsConnectedEl = document.getElementById('wsConnected');
const lastDataReceivedEl = document.getElementById('lastDataReceived');
const responseTimeMsAvgEl = document.getElementById('responseTimeMsAvg');

const testStatusMessageEl = document.getElementById('testStatusMessage');
const testButtonEl = document.getElementById('testButton');
const loadingIndicatorEl = document.getElementById('loadingIndicator');
const resultContainerEl = document.getElementById('resultContainer');
const testResultDetailEl = document.getElementById('testResultDetail');

/**
 * 상태 문자열/불리언에 따라 Bootstrap 배지 클래스를 반환합니다.
 */
function getStatusBadgeClass(status) {
    // boolean true, CONNECTED, success, OK는 성공
    if (status === true || status === 'CONNECTED' || status === 'success' || status === 'OK') {
        return 'bg-success';
    }
    // boolean false, DISCONNECTED, ERROR, fail은 실패
    if (status === false || status === 'DISCONNECTED' || status === 'ERROR' || status === 'fail') {
        return 'bg-danger';
    }
    return 'bg-warning'; // 로딩 또는 알 수 없는 상태
}

/**
 * URL 쿼리 파라미터에서 시리얼 번호를 가져옵니다.
 */
function getSerialNumberFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('serial');
}

/**
 * 장치 기본 상태 정보를 로드하고 화면에 표시합니다. (GET /status/{serial})
 * DTO: Admin_DeviceStatusRespDTO를 사용합니다.
 */
async function loadDeviceStatus() {
    deviceSerialNumber = getSerialNumberFromUrl();
    if (!deviceSerialNumber) {
        deviceNameEl.textContent = '오류: 시리얼 번호가 없습니다.';
        return;
    }

    deviceSerialEl.textContent = deviceSerialNumber;
    testButtonEl.textContent = '정보 로드 중...';
    testButtonEl.disabled = true;

    try {
        const url = `${API_HOST}${API_BASE_URL}/status/${deviceSerialNumber}`;
        const token = localStorage.getItem('token');
        const response = await fetch(url, {
             headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error(`장치 정보를 찾을 수 없습니다. (HTTP ${response.status})`);

        const data = await response.json(); // Admin_DeviceStatusRespDTO 객체

        // 1. 장치명
        deviceNameEl.textContent = data.deviceName || '이름 없음';

        // 2. DTO 상태 필드 업데이트

        // DB Status
        dbStatusEl.textContent = data.dbStatus || 'N/A';
        dbStatusEl.className = `badge ${getStatusBadgeClass(data.dbStatus)}`;

        // WS Connected
        const wsStatusText = data.wsConnected ? '연결됨' : '연결 끊김';
        wsConnectedEl.textContent = wsStatusText;
        wsConnectedEl.className = `badge ${getStatusBadgeClass(data.wsConnected)}`;

        // Last Data Received (ISO 8601 문자열 처리)
        if (data.lastDataReceived) {
            // ISO 8601 문자열을 Date 객체로 파싱 후 로컬 시간으로 변환
            lastDataReceivedEl.textContent = new Date(data.lastDataReceived).toLocaleString('ko-KR');
        } else {
            lastDataReceivedEl.textContent = '수신 기록 없음';
        }

        // Average Response Time
        responseTimeMsAvgEl.textContent = data.responseTimeMs !== null && data.responseTimeMs !== undefined
            ? `${data.responseTimeMs} ms`
            : 'N/A';

        // 테스트 버튼 활성화
        testButtonEl.textContent = '연결 테스트 실행';
        testButtonEl.disabled = false;
    } catch (error) {
        deviceNameEl.textContent = `로드 실패: ${error.message}`;
        testButtonEl.disabled = true;
        testButtonEl.textContent = '장치 정보 로드 실패로 테스트 불가';

        // 실패 시 상태 필드 초기화
        dbStatusEl.textContent = 'ERROR';
        dbStatusEl.className = `badge ${getStatusBadgeClass('ERROR')}`;
        wsConnectedEl.textContent = 'ERROR';
        wsConnectedEl.className = `badge ${getStatusBadgeClass('ERROR')}`;
        lastDataReceivedEl.textContent = 'N/A';
        responseTimeMsAvgEl.textContent = 'N/A';
    }
}

/**
 * 테스트 성공 시 상세 결과를 로드하여 표시합니다. (GET /test/result/{serial})
 * 이 API의 DTO는 별도의 응답 구조를 가진다고 가정합니다.
 */
async function loadTestResultDetail() {
    try {
        const url = `${API_HOST}${API_BASE_URL}/test/result/${deviceSerialNumber}`;
        const token = localStorage.getItem('token');
        const response = await fetch(url, {
             headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        if (!response.ok) throw new Error("테스트 상세 결과 조회 실패.");

        const result = await response.json();
        displayTestResult(result);

    } catch (error) {
        testResultDetailEl.innerHTML = `<p class="text-danger">상세 결과 로드 중 오류 발생: ${error.message}</p>`;
    } finally {
        resultContainerEl.style.display = 'block';
    }
}

/**
 * 테스트 결과를 화면에 표시합니다.
 * *가정*: /test/result 응답 DTO는 { status: 'success'|'fail', responseTimeMs: 123, dataStatus: 'OK'|'ERROR', responseData: 'JSON string' }를 포함합니다.
 */
function displayTestResult(result) {
    let responseDataText = result.responseData || "응답 데이터 없음";
    const statusText = result.status === 'success' ? '성공' : '실패';

    // 부트스트랩 DL 스타일을 사용
    testResultDetailEl.innerHTML = `
        <div class="alert alert-${result.status === 'success' ? 'success' : 'danger'}" role="alert">
            <h4 class="alert-heading">테스트 결과: ${statusText}</h4>
        </div>
        <dl class="row">
            <dt class="col-sm-4">응답 속도:</dt>
            <dd class="col-sm-8">${result.responseTimeMs !== undefined ? result.responseTimeMs + ' ms' : 'N/A'}</dd>

            <dt class="col-sm-4">응답 데이터 이상 유무 :</dt>
            <dd class="col-sm-8 text-${result.dataStatus === 'OK' ? 'success' : 'danger'}">${result.dataStatus || 'N/A'}</dd>
        </dl>

        <h3 class="mt-4">응답 데이터</h3>
        <pre class="bg-light p-3 border rounded" style="white-space: pre-wrap; word-break: break-all;">
${responseDataText}
        </pre>
    `;
}

/**
 * 연결 테스트를 실행합니다. (GET /test/{serial})
 * 'Unexpected end of JSON input' 오류를 방지하는 로직을 포함했습니다.
 */
async function runConnectionTest() {
    testButtonEl.disabled = true;
    loadingIndicatorEl.style.display = 'block';
    testStatusMessageEl.textContent = '테스트 명령을 전송하고 응답을 기다리는 중입니다...';
    testResultDetailEl.innerHTML = '';
    resultContainerEl.style.display = 'none';

    try {
        const url = `${API_HOST}${API_BASE_URL}/test/${deviceSerialNumber}`;
        const token = localStorage.getItem('token');
        const response = await fetch(url, {
             headers: {
                'Authorization': token ? `Bearer ${token}` : ''
            }
        });

        // 1. 응답이 204 No Content처럼 본문이 없을 경우 대비
        const contentLength = response.headers.get('content-length');
        if (contentLength === '0' || response.status === 204) {
             throw new Error("서버 응답 본문이 비어있습니다. (No Content)");
        }

        // 2. JSON 파싱 시도 (여기서 오류가 발생하면 catch로 이동)
        const resultJson = await response.json();
        const status = resultJson.status;

        if (status === 'success') {
            testStatusMessageEl.textContent = '테스트 성공';
            await loadTestResultDetail();
        } else {
            testStatusMessageEl.textContent = `테스트 실패: ${resultJson.message || '엣지 연결 실패 또는 타임아웃 발생.'}`;
            resultContainerEl.style.display = 'block';
            testResultDetailEl.innerHTML = `<p class="text-danger">연결 실패 또는 타임아웃: ${resultJson.message || '상세 정보 없음.'}</p>`;
        }

    } catch (error) {
        let errorMessage = error.message;

        if (errorMessage.includes('Unexpected end of JSON input')) {
            errorMessage = '서버가 불완전한 데이터를 보냈습니다. 백엔드 API 구현을 확인하세요.';
        } else if (errorMessage.includes('Failed to fetch')) {
            errorMessage = '네트워크 연결 오류 또는 CORS 문제로 서버에 접근할 수 없습니다.';
        }

        testStatusMessageEl.textContent = `❌ 테스트 실행 중 심각한 오류 발생: ${errorMessage}`;
        resultContainerEl.style.display = 'block';
        testResultDetailEl.innerHTML = `<p class="text-danger">통신 오류: ${errorMessage}</p>`;
    } finally {
        loadingIndicatorEl.style.display = 'none';
        testButtonEl.disabled = false;

        // 테스트 완료 후 DB 상태가 변경될 수 있으므로, 상태를 새로고침합니다.
        loadDeviceStatus();
    }
}


// --- Event Listener & Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. 초기 정보 로드
    loadDeviceStatus();

    // 2. 테스트 버튼 이벤트 리스너 연결
    testButtonEl.addEventListener('click', runConnectionTest);
});