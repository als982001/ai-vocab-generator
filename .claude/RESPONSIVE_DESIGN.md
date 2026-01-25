# 📱 Feature Implementation Plan: Mobile Responsiveness & Bug Fix

## 1. 개요 (Overview)

- **목표**: 윈도우 크기 조절 시 이미지 위의 Bounding Box 좌표가 어긋나는 버그를 수정하고, 추후 모바일 반응형 UI를 구축한다.
- **핵심 과제**:
  1. Image Overlay의 좌표계가 CSS 렌더링 사이즈와 1:1로 매핑되도록 구조 개선 (Coordinate Drift Fix).
  2. (추후) Tailwind CSS Breakpoint를 활용한 모바일 레이아웃 구현.

---

## 2. 기술 명세 (Technical Specs)

### 현재 파일 구조

| 파일                                                  | 역할                    |
| ----------------------------------------------------- | ----------------------- |
| `app/features/dashboard/pages/home-page.tsx`          | 메인 페이지, state 관리 |
| `app/features/dashboard/components/ImageOverlay.tsx`  | 바운딩 박스 오버레이    |
| `app/features/dashboard/components/ImageUploader.tsx` | 이미지 업로드 영역      |
| `app/features/dashboard/components/ResultPanel.tsx`   | 우측 단어 리스트        |

### 현재 레이아웃 구조

- `home-page.tsx`: Flex 레이아웃 (`flex flex-1`) 사용
- Sidebar + ImageUploader + ResultPanel이 가로로 배치됨

### 좌표 동기화 전략

- **현재 문제점**:
  - `ImageOverlay.tsx`에서 `onLoad` 이벤트로 이미지 크기를 한 번만 측정
  - 창 크기 변경 시 `imageSize` state가 업데이트되지 않음
  - 오버레이 div의 크기가 고정되어 이미지와 어긋남
  - **증상**: 창을 이미지 width보다 작게 줄이면 바운딩 박스가 이미지 우측 바깥으로 튀어나감

- **해결 방안**:
  - 오버레이 div에 `absolute inset-0` 적용
  - 이미지 크기를 state로 관리하지 않고, CSS로 이미지와 동일하게 맞춤
  - 박스 위치는 이미 % 단위로 계산되어 있으므로 자동으로 맞춰짐

---

## 3. 단계별 구현 계획 (Step-by-Step Tasks)

### Step 1: 좌표 어긋남 버그 수정 (Coordinate Mapping Fix)

> **가장 중요**: 화면 폭을 줄여도 박스가 단어 위에 정확히 붙어 있어야 함.

- [x] **`ImageOverlay.tsx` 컴포넌트 수정** ✅ 완료
  - `imageSize` state 및 `handleImageLoad` 로직 제거
  - 오버레이 div 스타일을 `absolute inset-0`으로 변경
  - `pointer-events-none`은 개별 박스에만 적용 (클릭 필요하므로)
  - **검증**: 브라우저 폭을 줄였다 늘렸다 했을 때 빨간 박스가 이미지 속 글자와 같이 움직이는지 확인

### Step 2: 모바일 레이아웃 구조 변경 (Responsive Layout)

- **목표**: JS를 이용한 조건부 렌더링을 지양하고, Tailwind CSS의 Breakpoint(`md:`)를 활용하여 단일 코드베이스로 반응형을 구현한다.
- **참고 자료**: `mockDatas/mobile_main_screenl.png` (모바일 디자인 시안), `mockDatas/mobile_main_code.html` (모바일 디자인 html)

#### Task 2-1: 컨테이너 방향 전환 (Flex Direction)

- [ ] **`app/features/dashboard/pages/home-page.tsx` 수정**
  - 최상위 컨테이너: `h-screen flex flex-col` 유지.
  - 메인 콘텐츠 래퍼: 기존 `flex`에 `flex-col md:flex-row`를 적용하여 모바일에서는 세로로, PC에서는 가로로 배치되도록 수정.
  - **CSS 전략**: `window.innerWidth` 사용 금지. 오직 Tailwind 유틸리티 클래스만 사용.

#### Task 2-2: 영역별 크기 및 스크롤 정책 최적화

- [ ] **ImageUploader (상단/좌측)**
  - 모바일: 화면 높이의 약 40~50% 차지 (`h-[45vh]`).
  - 데스크탑: 남은 영역 모두 차지 (`md:flex-1 md:h-full`).
- [ ] **ResultPanel (하단/우측)**
  - 모바일: 나머지 높이 차지 (`flex-1`), 내부 스크롤 적용.
  - 데스크탑: 고정 너비 (`md:w-[350px] md:h-full`).

#### Task 2-3: 사이드바(Navigation) 대응

- [ ] **Sidebar 숨김 처리**
  - PC(`md` 이상): 기존처럼 항상 노출.
  - 모바일(`md` 미만): `hidden` 처리.
- [ ] **모바일 헤더 추가**
  - `md:hidden` 속성을 가진 상단 헤더 컴포넌트 추가.
  - 좌측: 햄버거 메뉴 버튼 (클릭 시 Sidebar 열림).
  - 중앙: "Snap Voca" 타이틀.
  - 우측: 더보기 버튼 (옵션).
- [ ] **Sidebar Drawer 구현**
  - 햄버거 버튼 클릭 시 기존 `Sidebar` 컴포넌트가 좌측에서 슬라이드되어 나오도록 구현.
  - 오버레이(backdrop) 클릭 시 닫힘.

#### Task 2-4: FAB 버튼 추가 (모바일 전용)

- [ ] **Floating Action Button 추가**
  - 모바일에서만 표시 (`md:hidden`).
  - 위치: 우하단 고정 (`fixed bottom-8 right-6`).
  - 용도: 새 이미지 추가 + 추후 기능 확장용.

---

## 4. 검증 시나리오 (Verification)

### Step 1 검증

1. **Desktop Resizing**: 데스크탑 브라우저 창을 가로로 좁게 줄였을 때, 빨간 박스가 이미지 사이즈 변화에 맞춰 정확히 줄어드는가?
2. **Box Interaction**: 박스 hover/click이 정상 동작하는가?
3. **Word Card 연동**: 박스 클릭 시 해당 단어 카드로 스크롤되는가?
