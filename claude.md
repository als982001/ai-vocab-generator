# 프로젝트 개요 (Project Context)

- 프로젝트명: Snap-Voca (AI 일본어 단어장 생성기)
- 목표: 프론트엔드 취업 포트폴리오용 MVP 개발. 클린 코드와 사용자 경험(UX) 최우선.
- 기술 스택: React (Vite), TypeScript, Tailwind CSS (v4), Lucide React

# 이 프로젝트의 기능

## MVP(Minimum Viable Product) 플로우

1. 첫 화면은 세로로 3개로 나누어진 영역(Sidebar, Main, Result)으로 구성됨.
2. 가운데 영역(Main)에서 사진을 드래그 앤 드롭으로 업로드함.
3. (Mocking 단계) 업로드 시 로딩 후 분석된 결과가 나타나는 UI 시뮬레이션.
4. 우측 영역(Result)에서 추출된 단어와 뜻을 리스트로 보여주고 txt 다운로드 가능.

## 추가 개발 사항

- PDF 파일 업로드
- 업로드한 이미지에 추출한 단어를 표시
- 추출할 언어 및 번역 언어 선택 기능

# 코딩 규칙 (엄격 준수)

1. **함수형 컴포넌트 (Functional Components):** 클래스형 컴포넌트 대신 반드시 React Hooks를 사용할 것.
2. **TypeScript:** `any` 타입 사용 절대 금지. 모든 데이터 타입(Interface)은 `/src/types` 폴더에 명시적으로 정의할 것.
3. **스타일링:** Tailwind CSS 클래스만 사용. 인라인 스타일(`style={{...}}`) 사용 금지.
4. **모킹 (Mocking):** 실제 API를 연동하기 전에는 반드시 `@/mockDatas/mockData.json` 파일을 import하여 UI를 테스트할 것. (TypeScript에서 JSON import 시 `resolveJsonModule` 설정 필요)
5. **언어 설정:** 변수명과 함수명은 영어로, 사용자에게 보여지는 UI 텍스트는 한국어로 작성할 것.

# 디렉토리 구조 (Directory Structure)

- `/src/pages`: 라우팅의 단위가 되는 페이지. 주로 Container를 호출하여 화면을 그림. (예: `DashboardPage.tsx`)
- `/src/containers`: 페이지의 핵심 비즈니스 로직(State, Effect, API 호출)을 수행하고 Presentation 컴포넌트를 감싸는 곳. (예: `DashboardContainer.tsx`)
- `/src/components`: 컨테이너에서 렌더링되는 순수 UI(Presentational) 컴포넌트들.
  - `/src/components/shared`: 앱 전반에서 재사용되는 공용 UI (예: `Header`, `Button`, `Layout`)
  - `/src/components/[feature]`: 특정 기능에 종속된 UI (예: `/dashboard/ResultPanel`, `/dashboard/ImageUploader`)
- `/src/types`: TypeScript 인터페이스 및 타입 정의 (`.d.ts` 또는 `.ts`)
- `/src/mockDatas`: 개발 및 테스트용 리소스 폴더
  - `mockData.json`: API 응답 시뮬레이션을 위한 JSON 데이터
  - `mockDesign.html`: 디자인 참고용 HTML 스니펫
  - `screen.png`: 디자인 참고용 이미지

# 깃 & 배포 전략 (Git & Deployment Strategy)

1. **브랜치 정의**
   - **`main`**: 배포용 브랜치 (Production). `dev`에서 PR 머지 시 Vercel이 감지하여 자동 배포 수행.
   - **`dev`**: 개발용 브랜치 (Development). 모든 기능 개발의 기준점이자 통합 브랜치.

2. **작업 흐름 (Workflow)**
   - **Step 1 (Branching):** 항상 `dev` 브랜치를 기준으로 작업 브랜치(`feature/기능명`)를 생성하여 작업한다.
   - **Step 2 (Feature Merge):** 작업 브랜치 → `dev` 머지 시 **스쿼시 머지 (Squash Merge)** 사용.
     - *Rule:* 개별 작업의 자잘한 커밋 내역보다는 기능 단위의 완성이 중요하므로 커밋을 하나로 압축한다.
   - **Step 3 (Deployment):** `dev` → `main` 머지 시 **머지 커밋 (Merge Commit)** 사용.
     - *Rule:* `dev`에서 완성된 기능들의 히스토리를 `main`에 그대로 보존하여 배포 이력을 관리한다.