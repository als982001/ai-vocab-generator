# 프로젝트 개요 (Project Context)

- 프로젝트명: Snap-Voca (AI 일본어 단어장 생성기)
- 목표: 프론트엔드 취업 포트폴리오용 MVP 개발. 클린 코드와 사용자 경험(UX) 최우선.
- 기술 스택: React (Vite), TypeScript, Tailwind CSS, Lucide React (아이콘)

# 코딩 규칙 (엄격 준수)

1. **함수형 컴포넌트 (Functional Components):** 클래스형 컴포넌트 대신 반드시 React Hooks를 사용할 것.
2. **TypeScript:** `any` 타입 사용 절대 금지. 모든 데이터 타입(Interface)은 `/src/types` 폴더에 명시적으로 정의할 것.
3. **스타일링:** Tailwind CSS 클래스만 사용. 인라인 스타일(`style={{...}}`) 사용 금지.
4. **모킹 (Mocking):** 실제 API를 연동하기 전에는 반드시 `@/mockDatas/mockData.json` 파일을 import하여 UI를 테스트할 것. (TypeScript에서 JSON import 시 `resolveJsonModule` 설정 필요)
5. **언어 설정:** 변수명과 함수명은 영어로, 사용자에게 보여지는 UI 텍스트는 한국어로 작성할 것.

# 디렉토리 구조

- `/src/components`: 재사용 가능한 UI 컴포넌트 (예: Header, UploadArea, WordCard, FloatingButton)
- `/src/pages`: 페이지 단위 컴포넌트 (예: Dashboard)
- `/src/types`: TypeScript 타입 정의 파일 모음
- `/src/mockData.ts`: UI 테스트용 가짜 데이터
