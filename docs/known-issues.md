# 알려진 이슈

수정이 필요할 수 있지만 아직 처리하지 않은 문제를 기록한다.

## 배포 경로에서 약 3.4MB 이상 파일이 413으로 막힘

- 기록일: 2026-11-15
- 상태: 미해결 (재현 파일 크기 확인 필요)

### 증상

Vercel 배포(Preview 포함)에서 큰 파일을 올리면 `/api/analyze` 요청이 `413 Content Too Large`로 실패한다.
로컬(`localhost`)에서는 같은 파일이 정상 분석된다.

### 원인

- 업로더는 최대 5MB까지 허용한다 (`app/features/dashboard/components/FileUploader.tsx`의 `MAX_FILE_SIZE_MB`).
- 배포 경로는 파일을 base64로 바꿔 JSON 본문에 담는데, base64는 원본보다 약 1.33배 크다.
- Vercel 함수의 요청 본문 한도는 4.5MB라서, 원본이 약 3.4MB를 넘으면 함수가 실행되기 전에 플랫폼이 413을 돌려준다.
- 로컬은 브라우저가 Gemini를 직접 호출하므로 이 한도가 적용되지 않는다. 그래서 로컬에서는 재현되지 않는다.
- 스트리밍 도입 전부터 있던 제약이며, 이번 변경으로 생긴 회귀는 아니다.

### 현재 동작

클라이언트는 413을 `client` 오류로 분류해 "요청을 처리할 수 없습니다. 파일 형식과 크기를 확인한 뒤 다시 시도해주세요." 토스트를 띄운다 (`app/utils/analysisError.ts`의 `getKindFromHttpStatus`).
업로드 단계에서는 막히지 않으므로, 사용자는 업로드 후 분석 실패로 처음 알게 된다.

### 대응 방안

| 방법                                                             | 복잡도                | 효과                                                  |
| ---------------------------------------------------------------- | --------------------- | ----------------------------------------------------- |
| A. 업로드 한도를 3MB로 낮추기                                    | 낮음 (상수·안내 문구) | 업로드 단계에서 바로 안내. 이미지·PDF 모두 해당       |
| B. A + 이미지는 브라우저에서 축소·JPEG 변환 후 전송              | 중간                  | 큰 사진도 분석 가능. PDF는 줄일 수 없어 3MB 한도 유지 |
| C. 파일을 저장소(예: Supabase Storage)에 먼저 올리고 참조만 전송 | 높음                  | 크기 제한이 사실상 사라짐. 업로드 구조 신설 필요      |

우선 A를 권장한다. 큰 사진 업로드 수요가 확인되면 B를 별도 작업으로 진행한다.

### 확인할 것

- 실제로 413이 난 파일의 크기가 약 3.4MB를 넘는지
- 413일 때 위 토스트 문구가 실제로 표시되는지

---

아래는 스트리밍 적용(2단계) 리뷰에서 나왔지만 범위 밖이라 미룬 후속 과제다. 모두 기록일 2026-11-15, 상태 미해결.

## 안전 필터 차단이 "끝까지 받지 못했습니다"로 안내됨

- 위치: `shared/utils/geminiStream.ts` (`toAnalysisStreamEvents`), `app/services/analysisStream.ts`
- 증상: Gemini가 프롬프트를 차단하면(`promptFeedback.blockReason`) candidates와 finishReason이 없어 `INCOMPLETE_STREAM`이 된다. `SAFETY`·`RECITATION` finishReason도 STOP이 아니라서 `incomplete`로 처리된다.
- 영향: 다시 시도해도 같은 결과인데 "분석 결과를 끝까지 받지 못했습니다. 다시 시도해주세요."가 표시된다.
- 방안: 차단·안전 종료를 별도 이벤트 코드와 오류 kind(예: `blocked`)로 분리하고 "이 파일은 분석할 수 없는 내용이 포함돼 있습니다" 같은 문구를 둔다.

## 429(호출 한도 초과) 안내가 일반 서버 오류 문구로 표시됨

- 위치: `api/analyze.js` (`getUpstreamHttpError`), `app/utils/analysisError.ts`, `app/features/dashboard/utils/analysisErrorMessage.ts`
- 증상: 서버는 429에 "요청이 많습니다. 잠시 후 다시 시도해주세요."를 담아 보내지만, 클라이언트는 kind만 보고 `server` 문구("파일 분석에 실패했습니다…")를 띄운다. 로컬 경로의 상류 429도 같다.
- 영향: 사용자가 한도에 걸린 줄 모르고 바로 재시도한다.
- 방안: `rateLimited` kind를 추가하고 `RATE_LIMITED` code·429 상태를 그쪽으로 매핑한다.

## 개발 중 Fast Refresh(HMR)로 분석 스피너가 멈출 수 있음

- 위치: `app/features/dashboard/hooks/useFileAnalysis.ts` (mount effect cleanup)
- 증상: 분석 중 코드를 저장하면 effect cleanup이 실행돼 요청이 abort되지만 컴포넌트는 살아 있다. 요청은 stale로 판정돼 `setIsAnalyzing(false)` 없이 끝나 스피너가 남는다.
- 영향: 개발 환경 전용. 파일 제거 버튼으로 복구된다. 프로덕션 영향 없음.
- 방안: cleanup에서 abort할 때 현재 요청이면 `isAnalyzing`도 정리하거나, unmount와 effect 재실행을 구분한다.

## 스트리밍 중 접근성

- 위치: `app/features/dashboard/components/ResultPanel.tsx`
- 증상
  - 임시 카드 목록에 `pointer-events-none`만 걸려 있어 카드 안 TTS 버튼에 키보드(Tab·Enter)로 접근할 수 있다.
  - 헤더의 `aria-live="polite"`가 단어가 추가될 때마다 갱신돼 스크린리더가 자주 읽는다.
- 방안: 스트리밍 중 목록에 `inert`를 적용한다. live 영역은 숫자만 두거나 갱신 빈도를 줄인다.

## 결과 패널 카드의 순차 등장(stagger) 효과 손실

- 위치: `app/components/motion/AnimatedList.tsx` (`animateOnMount`), `ResultPanel.tsx`
- 증상: 늦게 추가된 카드가 opacity 0에 멈추던 버그를 고치려고 카드가 각자 등장 애니메이션을 하게 바꿨다. 그 결과 스트리밍이 아닌 빠른 응답에서도 카드가 순서대로가 아니라 한꺼번에 나타난다.
- 방안: 마운트 순서(index)에 따라 `transition.delay`를 주는 방식으로 순차 등장을 되살린다. 회귀 테스트는 `e2e/analyze-stream.spec.ts`의 시간차 스트림 테스트가 있다.

## 스트림 이벤트 정의 중복

- 위치: `shared/constants/analysisStream.ts`, `app/services/analysisStream.ts` (zod 스키마)
- 증상: 이벤트 모양이 shared 타입·상수와 클라이언트 zod 스키마에 따로 적혀 있다. `ANALYSIS_STREAM_EVENT_TYPES`, `ANALYSIS_HTTP_ERROR_CODES` 일부는 런타임에서 쓰이지 않는다.
- 영향: 한쪽만 바뀌면 서버·클라이언트가 어긋날 수 있다.
- 방안: zod 스키마에 `satisfies z.ZodType<AnalysisStreamEvent>`를 걸어 타입 동치를 강제하거나, 상수에서 스키마를 파생한다.

## 기타 (사소함)

- 같은 오류가 두 번 로그된다: `app/services/gemini.ts`의 `console.error` + `useFileAnalysis.ts` catch의 `console.error`.
- `e2e/analyze-stream.spec.ts`의 시간차 스트림 테스트가 fixture 단어 3개를 전제로 "2개", `cardLocators[2]`를 하드코딩한다. fixture가 바뀌면 깨지므로 `ENGLISH_WORDS.length`에서 파생하면 좋다.
- `app/services/gemini.ts`의 `fileToGenerativePart`는 FileReader 결과가 null이면 handler 안에서 예외가 나 Promise가 끝나지 않는다(기존 코드). 지금은 파일 제거 버튼으로 빠져나올 수 있다.
