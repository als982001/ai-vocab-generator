# 📸 Snap-Voca (AI 단어장 생성기)

이미지에서 일본어 단어를 추출하여 한국어 번역과 발음(후리가나)이 포함된 단어장을 자동으로 생성합니다.

| Type             | Link                                                              |
| :--------------- | :---------------------------------------------------------------- |
| **🚀 Live Demo** | [**배포 사이트 바로가기**](https://ai-vocab-generator.vercel.app) |
| 📂 GitHub        | [소스 코드 보기](https://github.com/als982001/ai-vocab-generator) |
| 📝 Tech Blog     | [개발 과정 회고 (Velog/Tistory)](https://jmjjjmj.tistory.com/)    |

## 🛠 Tech Stack

- **Framework:** React 19 + Vite 7
- **Routing:** React Router 7
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI:** Google Gemini 2.5 Flash API
- **UI Libraries:** Lucide React, Sonner (Toast), React Dropzone
- **Other:** Web Speech API (TTS)

## ✨ Features

### 📤 메인 페이지 (`/`)

이미지에서 일본어 단어를 추출하여 단어장을 생성합니다.

<div align="center">
  <img src=".github/assets/main01.png" alt="이미지 업로드" width="70%">
  <br><br>
  <img src=".github/assets/main02.png" alt="단어 추출 결과" width="70%">
</div>

- **Drag & Drop 업로드**: 이미지를 드래그앤드롭으로 간편하게 업로드
- **AI 단어 추출**: Google Gemini API를 통해 이미지 속 일본어 단어 자동 인식
- **JLPT 레벨 표시**: 각 단어의 난이도 레벨 (N5~N1) 자동 판별
- **후리가나 지원**: 일본어 발음(읽는 법) 제공
- **데이터 내보내기**: 추출된 단어장을 TXT 또는 CSV 파일로 다운로드

#### v0.2.0 ~ v0.3.0 추가 기능

<div align="center">
  <img src=".github/assets/mobile_main.png" alt="모바일 메인 화면" width="30%">
  &nbsp;&nbsp;
  <img src=".github/assets/csv_feature.png" alt="CSV 다운로드 기능" width="50%">
</div>

- **바운딩 박스 표시**: 추출된 단어의 위치를 이미지 위에 박스로 표시
- **단어 상호작용**: 이미지 내 박스 클릭 시 해당 단어 카드로 자동 스크롤
- **모바일 반응형 지원**: 모바일 화면에 최적화된 레이아웃 제공
- **CSV 다운로드**: Anki 및 엑셀 호환을 위한 CSV 포맷 지원 (UTF-8 BOM 적용)

### 📚 히스토리 페이지 (`/history`)

과거에 분석한 모든 단어를 카드 형태로 확인하고 관리합니다.

<div align="center">
  <img src=".github/assets/history01.png" alt="히스토리 페이지" width="70%">
</div>

**모바일 히스토리 UI (v0.3.0)**

<div align="center">
  <img src=".github/assets/mobile_history.png" alt="모바일 히스토리 페이지" width="30%">
</div>

- **반응형 리스트 뷰**: 데스크톱(Grid) ↔ 모바일(Stack) 자동 전환 레이아웃
- **모바일 최적화**: 햄버거 메뉴, 플로팅 액션 버튼(FAB) 등 모바일 전용 UI 적용
- **정렬 기능**: 최신순, 오래된순, 난이도순(N5→N1, N1→N5) 정렬
- **필터 기능**: 연도별, JLPT 레벨별 필터링
- **단어 편집/삭제**: 뜻 수정 및 불필요한 단어 삭제 (실행 취소 지원)
- **발음 듣기**: TTS(Text-to-Speech)로 일본어 발음 청취

## 🔧 주요 구현 사항 (2026.02.01 기준)

### 1. LocalStorage 기반 CRUD 구현

- **영구 저장**: 서버 없이도 브라우저에서 단어 데이터를 생성/읽기/수정/삭제할 수 있도록 구현
- **서비스 레이어 분리**: `localStorage.ts`에서 데이터 접근 로직을 캡슐화하여 추후 백엔드 마이그레이션 용이
- **실행 취소 기능**: Sonner Toast의 `action` 속성을 활용해 삭제/수정 작업 즉시 복구 가능

### 2. 성능 최적화

- **`useMemo`를 활용한 필터링/정렬**: history-page.tsx
  - 대량의 단어 카드 렌더링 시 불필요한 재계산 방지
  - 정렬(최신순/오래된순/난이도순)과 필터(연도/레벨)를 메모이제이션하여 성능 개선

### 3. UX 강화

- **TTS 음성 듣기**: Web Speech API를 활용한 일본어 발음 재생
- **즉각적인 피드백**: Sonner를 통한 토스트 알림으로 모든 데이터 조작에 실시간 피드백 제공
- **다운로드 옵션 제공**: Radix UI 기반 드롭다운 메뉴를 통해 TXT/CSV 포맷 선택 가능

### 4. AI 이미지 분석 & 시각화

- **Google Gemini 2.5 Flash API** 연동: OCR + 번역 + 레벨 판정을 한 번의 API 호출로 처리
- **좌표 기반 오버레이**: AI 응답에서 단어 좌표를 받아 이미지 위에 바운딩 박스 렌더링
- **반응형 좌표 계산**: 창 크기 변경 시에도 박스 위치가 정확하게 유지되도록 구현

### 5. 모바일 반응형 아키텍처 (v0.3.0)

- **Layout Shift 방지**: Tailwind CSS Breakpoint(`md:`)를 활용하여 JS 개입 없이 CSS 레벨에서 레이아웃 전환
- **모바일 전용 컴포넌트**:
  - `Sheet` (Drawer): 모바일에서 사이드바 메뉴를 대체하는 드로어 구현
  - `FloatingActionButton`: 모바일 환경에서 주요 기능(업로드/다운로드) 접근성 강화

### 6. 데이터 내보내기 고도화 (CSV)

- **인코딩 처리**: 엑셀(Excel)에서 한글/일본어 깨짐 방지를 위해 **UTF-8 BOM(\uFEFF)** 적용
- **데이터 무결성**: 쉼표(`,`)나 줄바꿈이 포함된 텍스트가 셀을 깨뜨리지 않도록 이스케이프 처리 구현
- **Anki 호환성**: 암기 앱(Anki)에서 즉시 가져올 수 있는 포맷 표준 준수

## 💡 기술적 의사결정 (2026.02.01 기준)

### CSV 생성을 클라이언트에서 처리한 이유

- **서버 부하 감소**: 별도의 백엔드 API 호출 없이 브라우저의 `Blob` 객체를 활용하여 즉시 파일 생성
- **보안**: 사용자 데이터가 서버를 거치지 않고 로컬에서 바로 파일로 변환됨

## 🗺️ Roadmap

- [x] MVP: 일본어 → 한국어 단어장 생성
- [x] Drag & Drop 이미지 업로드
- [x] 단어 카드 UI 구현
- [x] 실제 AI API 연동 (Google Gemini)
- [x] 히스토리 관리 기능 (LocalStorage)
- [x] TTS 발음 듣기 기능
- [x] CSV / Anki 포맷 내보내기
- [x] 모바일 반응형 UI 완벽 지원
- [ ] 다국어 지원 (영어, 중국어 등)
- [ ] PDF 파일 업로드 지원

## 📂 Directory Structure
