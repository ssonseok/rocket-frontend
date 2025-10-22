const API_BASE_URL = "/api/device";
        const API_HOST = "http://localhost:8080";

        let deviceSerialNumber = null;

        // --- DOM Elements ---
        const deviceNameEl = document.getElementById('deviceName');
        const deviceSerialEl = document.getElementById('deviceSerial');
        const wsStatusEl = document.getElementById('wsStatus');
        const testStatusMessageEl = document.getElementById('testStatusMessage');
        const testButtonEl = document.getElementById('testButton');
        const loadingIndicatorEl = document.getElementById('loadingIndicator');
        const resultContainerEl = document.getElementById('resultContainer');
        const testResultDetailEl = document.getElementById('testResultDetail');

        /**
         * URL 쿼리 파라미터에서 시리얼 번호를 가져옵니다.
         */
        function getSerialNumberFromUrl() {
            const params = new URLSearchParams(window.location.search);
            return params.get('serial');
        }

        /**
         * 장치 기본 상태 정보를 로드합니다. (GET /status/{serial})
         */
        async function loadDeviceStatus() {
            deviceSerialNumber = getSerialNumberFromUrl();
            if (!deviceSerialNumber) {
                deviceNameEl.textContent = '오류: 시리얼 번호가 없습니다.';
                return;
            }

            deviceSerialEl.textContent = deviceSerialNumber;

            try {
                const url = `${API_HOST}${API_BASE_URL}/status/${deviceSerialNumber}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error("장치 정보를 찾을 수 없습니다.");

                const data = await response.json();

                deviceNameEl.textContent = data.deviceName || '이름 없음';

                wsStatusEl.textContent = 'DB에서 정보 로드 완료';
            } catch (error) {
                deviceNameEl.textContent = `로드 실패: ${error.message}`;
                wsStatusEl.textContent = '장치 정보 로드 실패';
                testButtonEl.disabled = true;
            }
        }

        /**
         * 테스트 성공 시 상세 결과를 로드하여 표시합니다. (GET /test/result/{serial})
         */
        async function loadTestResultDetail() {
            try {
                const url = `${API_HOST}${API_BASE_URL}/test/result/${deviceSerialNumber}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error("테스트 상세 결과 조회 실패.");

                const result = await response.json();
                displayTestResult(result);

            } catch (error) {
                testResultDetailEl.innerHTML = `<p style="color: red;">상세 결과 로드 중 오류 발생: ${error.message}</p>`;
            } finally {
                resultContainerEl.style.display = 'block';
            }
        }

        /**
         * 테스트 결과를 화면에 표시합니다.
         */
        function displayTestResult(result) {
            // CSS는 제거되었으므로, 간단한 텍스트로 표시합니다.
            testResultDetailEl.innerHTML = `
                <div>
                    <h3>테스트 결과: ${result.status}</h3>
                </div>
                <dl>
                    <dt>장치명:</dt>
                    <dd>${result.name}</dd>

                    <dt>응답 속도:</dt>
                    <dd>${result.responseTimeMs} ms</dd>

                    <dt>응답 데이터 상태:</dt>
                    <dd>${result.dataStatus}</dd>
                </dl>

                <h3>엣지 응답 전문</h3>
                <pre style="white-space: pre-wrap; word-break: break-all; border: 1px solid #ddd; padding: 5px;">
                    ${result.responseData}
                </pre>
            `;

            // WS 상태 업데이트 (테스트 결과에 따라)
            wsStatusEl.textContent = result.status === '성공' ? '연결 및 통신 성공' : '연결 실패 또는 타임아웃';
        }

        /**
         * 연결 테스트를 실행합니다. (GET /test/{serial})
         */
        async function runConnectionTest() {
            testButtonEl.disabled = true;
            loadingIndicatorEl.style.display = 'block';
            testStatusMessageEl.textContent = '테스트 명령을 전송하고 응답을 기다리는 중입니다...';
            testResultDetailEl.innerHTML = '';
            resultContainerEl.style.display = 'none';

            try {
                const url = `${API_HOST}${API_BASE_URL}/test/${deviceSerialNumber}`;
                const response = await fetch(url);

                const resultJson = await response.json();
                const status = resultJson.status;

                if (status === 'success') {
                    testStatusMessageEl.textContent = '✅ 테스트 성공! 상세 결과를 불러옵니다.';
                    await loadTestResultDetail();
                } else {
                    testStatusMessageEl.textContent = `❌ 테스트 실패: ${resultJson.message || '엣지 연결 실패 또는 타임아웃 발생.'}`;
                    wsStatusEl.textContent = '연결 실패 또는 타임아웃';
                    resultContainerEl.style.display = 'block';
                    testResultDetailEl.innerHTML = `<p style="color: red;">연결 실패 또는 타임아웃: 상세 정보 없음.</p>`;
                }

            } catch (error) {
                testStatusMessageEl.textContent = `❌ 테스트 실행 중 심각한 오류 발생: ${error.message}`;
                wsStatusEl.textContent = '통신 오류';
            } finally {
                loadingIndicatorEl.style.display = 'none';
                testButtonEl.disabled = false;
            }
        }


        // --- Event Listener & Initialization ---

        document.addEventListener('DOMContentLoaded', () => {
            // 1. 초기 정보 로드
            loadDeviceStatus();

            // 2. 테스트 버튼 이벤트 리스너 연결
            testButtonEl.addEventListener('click', runConnectionTest);
        });