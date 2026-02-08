# UI/UX Polish Plan (Animation & Micro-interactions)

## 1. 개요 (Overview)

- **목표**: 정적인 앱에 애니메이션과 상호작용 피드백을 추가하여 "완성도 높은 상용 서비스" 느낌을 준다.
- **디자인 컨셉**: **Soft & Bouncy** (부드럽게 떠오르고, 쫀득하게 반응함)

### 기술 선택 기준

| 구분        | 기술                                                 | 용도                                                      |
| ----------- | ---------------------------------------------------- | --------------------------------------------------------- |
| 단순 효과   | **Tailwind CSS** (`transition`, `hover:`, `active:`) | Hover/Tap scale, 색상 변화, opacity 전환 등               |
| 복잡한 효과 | **framer-motion**                                    | Stagger 순차 등장, Spring 물리 애니메이션, 페이지 전환 등 |

> 이미 Tailwind `transition`이 적용된 컴포넌트(DesktopWordCard, DownloadDropdown 등)는 기존 방식을 확장하여 사용한다.

---

## 2. 공통 요소 (Global Components)

### A. 버튼 & 인터랙티브 요소 (Micro-interactions) — Tailwind CSS

모든 클릭 가능한 요소(버튼, 아이콘)에 쫀득한 손맛을 추가합니다.

- **Hover**: 마우스를 올리면 살짝 커짐 (`hover:scale-105`)
- **Tap (Click)**: 누르는 순간 살짝 작아짐 (`active:scale-95`)
- **적용 대상**: 사이드바 메뉴, 토글 스위치, 필터 버튼, 닫기 아이콘 등.
- **구현**: `transition-transform duration-200` + `hover:scale-105 active:scale-95`

### B. 페이지 전환 (Page Transition) — framer-motion

- **효과**: 페이지 이동 시 내용이 부드럽게 페이드인(`opacity: 0 → 1`) 되며 살짝 아래에서 위로 올라옴.
- **적용**: Dashboard ↔ History 이동 시.

---

## 3. 대시보드 화면 (Dashboard)

### A. 우측 결과 패널 (Result List) - "Staggered Entrance" — framer-motion

단어 분석이 완료되면 카드가 한 번에 '팍' 뜨지 않고, **위에서부터 순차적으로 '타다닥'** 나타나게 합니다.

- **Parent**: `staggerChildren: 0.1` (0.1초 간격)
- **Child (Card)**:
  - `initial`: `{ opacity: 0, y: 20 }` (투명하게 아래에 있음)
  - `animate`: `{ opacity: 1, y: 0 }` (위로 스르륵 올라옴)

### B. 단어 카드 (Word Card) — Tailwind CSS

- **Hover Effect**:
  - 마우스를 올리면 카드가 살짝 위로 떠오름 (`hover:-translate-y-1`).
  - 그림자(Shadow)가 진해짐 (`hover:shadow-lg`).
  - 배경색이 아주 미세하게 밝아짐.
- **Active State (바운딩 박스 연동)**:
  - `ImageOverlay`에서 바운딩 박스를 클릭하면 `handleWordClick`이 실행되어 해당 단어 카드로 스크롤됨.
  - 스크롤 도착 시 카드에 **잠깐 반짝(Highlight)** 효과 추가 — 테두리 색이 `border-primary`로 변경되었다가 원래대로 돌아오는 애니메이션.

### C. 다운로드 드롭다운 (Download Button) - "Spring Pop-up" — framer-motion

- **Trigger**: 버튼 클릭 시 화살표 아이콘 회전 (이미 `rotate-180` 적용됨).
- **Menu List**:
  - **위치**: 버튼 바로 위에서 시작.
  - **애니메이션**: `scale: 0.8`, `opacity: 0`에서 `scale: 1`, `opacity: 1`로 **통통 튀듯이(Spring)** 커지며 등장.
  - **방향**: `transformOrigin: "bottom center"` (아래에서 위로 커짐).

---

## 4. 히스토리 화면 (History Page)

### A. 카드 그리드 (Grid Layout) - "순차 등장" — framer-motion

히스토리 페이지 진입 시, 카드가 순차적으로 등장합니다.

- **구현**: Dashboard의 Stagger 등장 효과와 동일하되, Grid 형태에 맞춰 적용.
- **Lazy Loading**: 스크롤을 내릴 때 새로운 카드가 나타나면 부드럽게 페이드인 (`viewport={{ once: true }}`).

### B. 카드 인터랙션 (Card Interaction) — Tailwind CSS

- **Hover**:
  - `hover:scale-[1.02]`, `hover:-translate-y-1`.
  - 우측 상단 날짜 텍스트가 평소엔 흐리다가, Hover 시 진해짐 (`group-hover:text-text-primary`).
- **TTS 버튼** (`playTTS`):
  - 스피커 아이콘(Volume2) 클릭 시 아이콘이 잠깐 커졌다 작아지는 효과 (`active:scale-125 transition-transform`).

### C. 헤더 다운로드 버튼

- **통일성**: Dashboard 하단 버튼과 동일한 Spring 애니메이션 적용.
- **위치**: 헤더 우측 상단이므로, 메뉴가 **아래쪽**으로 펼쳐지는 애니메이션 적용 (`transformOrigin: "top right"`).

---

## 5. 이미지 업로드 영역 (Image Upload Area)

현재 `ImageUploader.tsx`에 `react-dropzone` 기반 드래그 앤 드롭이 구현되어 있으며, 아이콘에 `hover:scale-110 transition-transform`이 적용된 상태.

### A. 드래그 진입 피드백 — Tailwind CSS

- **드래그 중 (`isDragActive`)**: 업로드 영역 테두리가 `border-primary`로 변경되고, 배경에 `bg-primary/5` 반투명 색상 적용.
- **아이콘 바운스**: 드래그 진입 시 CloudUpload 아이콘이 위아래로 가볍게 바운스 (`animate-bounce`).
- **텍스트 변경**: "여기에 놓으세요" 등 안내 문구가 부드럽게 전환.

### B. 업로드 완료 피드백 — Tailwind CSS

- 이미지가 성공적으로 로드되면 잠깐 `ring-2 ring-green-400`이 나타났다가 사라지는 효과.

---

## 6. 로딩 상태 (Loading State)

현재 `ImageUploader.tsx` 내부에서 `Loader2` 아이콘 + `animate-spin`과 텍스트("이미지 분석 중...")만 표시되는 상태.

### A. 텍스트 페이드 순환 — Tailwind CSS / framer-motion

- 분석 중 텍스트가 단계별로 바뀌며 페이드 전환: "이미지 분석 중..." → "단어를 추출하고 있어요..." → "거의 다 됐어요..."
- `AnimatePresence`로 텍스트 교체 시 부드러운 전환.

### B. 프로그레스 바 — Tailwind CSS

- 스피너 아래에 얇은 프로그레스 바 추가.
- 실제 진행률이 아닌 **시각적 피드백용**: `transition-all duration-1000`으로 천천히 채워지는 애니메이션.

### C. 스켈레톤 UI — Tailwind CSS

- 로딩 완료 직전, 결과 패널에 카드 형태의 스켈레톤(`animate-pulse` + 회색 블록)을 먼저 보여주고, 데이터 도착 시 실제 카드로 교체.

---

## 7. 구현 우선순위 (Implementation Steps)

1. **Step 1 (가성비 최고)**: 단어 카드 리스트/그리드에 **순차 등장(Stagger)** 효과 적용 → `npm install framer-motion` 필요
2. **Step 2 (손맛)**: 모든 버튼과 카드에 **Hover/Tap** 효과 적용 → Tailwind CSS만으로 구현
3. **Step 3 (디테일)**: 다운로드 드롭다운 메뉴에 **Spring** 애니메이션 적용 → framer-motion
4. **Step 4 (업로드 UX)**: 이미지 업로드 영역 드래그 피드백 강화 → Tailwind CSS
5. **Step 5 (로딩 UX)**: 로딩 상태 개선 (텍스트 순환, 프로그레스 바, 스켈레톤 중 선택) → 범위에 따라 결정
