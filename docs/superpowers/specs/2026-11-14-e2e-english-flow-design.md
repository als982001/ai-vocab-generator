# E2E 테스트 설계: 영어 단어 추출 흐름

## 목적

`영어 선택 → 이미지 업로드 → 분석 중 언어 잠금 → 결과 단어·뜻 표시 → 결과 후 잠금 유지 → 파일 제거 시 해제` 흐름을
실제 브라우저에서 검증한다. 앱 로직과 인증 가드는 실제로 실행하고, 브라우저 밖으로 나가는 요청만 통제한다.

## 목표 / 비목표 / 안티 목표

- 목표: 위 흐름 1개를 결정적(deterministic)으로 통과시키는 Playwright 테스트 + 실패 시 증거(스크린샷·trace·비디오·HTML 보고서)
- 비목표: CI 연동, 모바일 드로어 흐름, 히스토리 페이지, PDF 업로드, 실제 Gemini 품질 검증
- 안티 목표: 인증 가드 제거·우회 플래그 추가, 고정 시간 대기, 실제 외부 요청(Gemini·Supabase·기타) 발생

## 접근 방식

| 대상                                                   | 처리                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| 브라우저 조작, React 상태, 언어 잠금, `normalizeWords` | 실제 실행                                                               |
| `ProtectedLayout` 인증 가드                            | 실제 실행 (코드 변경 없음)                                              |
| 로그인 세션                                            | `addInitScript`로 localStorage `sb-e2etest-auth-token`에 가짜 세션 주입 |
| Gemini                                                 | `generativelanguage.googleapis.com/.../:generateContent` 네트워크 mock  |
| Supabase 저장                                          | `rest/v1/analyses`, `rest/v1/words` 네트워크 mock + 본문 기록           |

검토 후 제외한 대안

- `/auth/v1/*` mock으로 OAuth 흐름 흉내: Google 리다이렉트가 끼어 복잡하고 깨지기 쉬움
- `VITE_E2E` 플래그로 가드 우회: 인증 보호 제거라 요구사항 위반

## 성공 조건 (단일 테스트)

1. `/` 진입 시 `/login`으로 이동하지 않고 언어 select가 보임 (세션 주입 성공)
2. "영어" 선택 → select 값 `en`, "CEFR Level" 노출
3. Gemini 요청 대기와 Supabase 저장 대기를 **업로드 전에** 등록
4. 영어 샘플 PNG 업로드
5. Gemini 요청 도착 확인 후, 응답을 붙잡은 상태에서: select `disabled`, 잠금 안내 문구, "이미지 분석 중..." 노출
6. 응답 해제 → 픽스처 단어 3개와 각 뜻 노출, "분석을 성공했습니다." 토스트
7. 저장 내용 검증
   - `analyses` POST 1회: `language === "en"`, `user_id === 테스트 사용자 ID`, `image_name === 업로드 파일명`
   - `words` POST 1회: 단어 3개, 모든 행의 `analysis_id === analyses mock 응답 id`, `user_id === 테스트 사용자 ID`
8. 결과 후에도 select `disabled` 유지
9. "파일 제거" 클릭 → select 활성화, 잠금 안내 문구 사라짐

## 외부 요청 통제

- 기준 주소 `http://localhost:5173` (`isLocalEnvironment()`가 `localhost`에서만 true → 브라우저가 Gemini 직접 호출)
- `context.route("**/*")` 누수 가드를 가장 먼저 등록 (나중 등록 route가 우선이므로 개별 mock이 먼저 처리)
  - `localhost:5173` → 통과
  - Google Fonts CSS → 빈 CSS 200 (`app.css`의 `@import`)
  - 그 외 → abort + URL 기록, fixture teardown에서 목록이 비어 있는지 단언
- `serviceWorkers: "block"`: 서비스워커가 처리한 요청은 route로 가로채지 못할 수 있으므로 서비스워커 등록 자체를 막음
- `webServer.env`에 더미 `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`/`VITE_GEMINI_API_KEY` 주입 (프로세스 env가 `.env`보다 우선)
- `reuseExistingServer: false` + `--strictPort`: 기존 dev 서버(실제 `.env`)를 재사용하지 않음. 실행 전 5173 dev 서버 종료 필요

## 대기와 정리

- 고정 시간 대기 금지. web-first assertion(`toBeDisabled`, `toHaveValue`, `toBeVisible`)과 `waitForRequest`, `expect.poll` 사용
- `waitForRequest`는 업로드 전에 Promise를 만들어 두고 업로드 후 await (빠른 요청 누락 방지)
- Gemini 응답은 deferred gate로 붙잡음. 테스트가 중간에 실패해도 fixture teardown에서 gate를 해제하고 route를 정리

## 실패 증거

- `screenshot: "only-on-failure"`, `trace: "retain-on-failure"`, `video: "retain-on-failure"`
- reporter: `list` + `html`(`playwright-report/`, 자동 열기 없음)
- 누수 가드가 차단한 URL은 실패 메시지에 출력

## 변경 파일

설치: `@playwright/test` (devDependency), Chromium 바이너리

새 파일

- `playwright.config.ts`
- `e2e/analyze-english.spec.ts`
- `e2e/support/auth.ts` (가짜 세션)
- `e2e/support/network.ts` (누수 가드, Gemini·Supabase mock, gate)
- `e2e/support/test.ts` (위 둘을 묶은 custom fixture)
- `e2e/fixtures/english-sentences.png`, `e2e/fixtures/english-response.json`

기존 파일

- `package.json`: `test:e2e`, `test:e2e:report` 스크립트
- `.gitignore`: `test-results/`, `playwright-report/`
- `Sidebar.tsx`: 언어 select `aria-label="추출 언어"`
- `FileUploader.tsx`: X 버튼 `aria-label="파일 제거"` + `type="button"`, dropzone input `aria-label="파일 업로드"` (모바일 FAB input과 구분)

## 빌더 재량 / 내 판단

- 픽스처 이미지는 영어 문장 PNG를 한 번 생성해 사용 (Gemini가 mock이라 내용은 결과에 영향 없음)
- Chromium, 데스크톱 1280×800, retries 0
- CI는 첫 테스트 통과 후 별도 작업
