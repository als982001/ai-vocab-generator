# 📱 Feature Implementation Plan: Mobile History Page

## 1. 개요 (Overview)

- **목표**: 데스크탑 전용으로 구현된 History 페이지(`app/features/history/pages/history-page.tsx`)를 모바일 반응형으로 개선한다.
- **디자인 레퍼런스**:
  - `mockDatas/mobile_history_screen.png` - 메인 화면
  - `mockDatas/mobile_history_filter_screen.png` - 필터 Bottom Sheet
- **핵심 전략**:
  - Grid 시스템을 `grid-cols-4` (Desktop)에서 `grid-cols-1` (Mobile)로 변경.
  - Sidebar를 모바일에서는 숨기고, 기존 `SidebarDrawer` 컴포넌트를 재사용.
  - FAB UI 추가 (기능 미구현, `hidden` 처리).

---

## 2. 기술 명세 (Technical Specs)

### A. 레이아웃 (Layout)

- **Container**: `flex-col` 구조.
- **Header**:
  - Mobile (`md:hidden`): [Menu Icon] - [Title] - [Filter Icon]
  - Desktop (`hidden md:flex`): 기존 헤더 유지.
- **Navigation**:
  - Mobile: 기존 `SidebarDrawer` 컴포넌트 재사용.
  - Desktop: 기존 `Sidebar` 고정 노출.

### B. 공용 컴포넌트 이동

- `MobileHeader`, `SidebarDrawer`를 `app/components/shared/`로 이동하여 재사용성 확보.
  - `app/features/dashboard/components/MobileHeader.tsx` → `app/components/shared/MobileHeader.tsx`
  - `app/features/dashboard/components/SidebarDrawer.tsx` → `app/components/shared/SidebarDrawer.tsx`

### C. 검색바 (Search Bar)

- **Mobile**: 헤더 아래에 별도 영역으로 분리 (`md:hidden`)
- **Desktop**: 기존 위치 유지 (헤더 내부, `hidden md:block`)

### D. 단어 리스트 (Word Grid)

- **Responsive Grid**:
  - `grid-cols-1` (Mobile) -> `md:grid-cols-2` -> `lg:grid-cols-3` -> `xl:grid-cols-4` (Desktop).

### E. 단어 카드 (모바일 전용 변경사항)

| 요소        | Desktop                 | Mobile             |
| ----------- | ----------------------- | ------------------ |
| 레이아웃    | 중앙 정렬               | 좌측 정렬          |
| 레벨 뱃지   | pill 형태               | 원형 (h-8 w-8)     |
| 후리가나    | `<p>{reading}</p>` 분리 | `<ruby>` 태그 통합 |
| Edit/Delete | hover 시 표시           | 숨김               |
| 볼륨 버튼   | 좌측 하단               | 좌측 하단 유지     |

### F. 모바일 필터 (Bottom Sheet)

- 우측 상단 Filter 아이콘 클릭 시 Bottom Sheet 형태로 열림
- 구성 요소:
  - **Sort By**: Newest First, Oldest First, Level N5→N1, Level N1→N5
  - **Created At**: 연도 선택 버튼 (2025, 2026)
  - **JLPT Level**: N5~N1 원형 버튼 (다중 선택)
  - **Actions**: Reset, Show Results 버튼
- 기존 필터 로직(`useWordFilter`)과 연결

### G. FAB (Floating Action Button)

- 화면 우측 하단에 공유/내보내기 버튼 UI 배치
- **현재는 `hidden` 처리** (기능 미구현)
- 추후 구현 시 활성화 예정

---

## 3. 단계별 구현 계획 (Step-by-Step Tasks)

### Step 1: 공용 컴포넌트 이동

- [ ] `MobileHeader.tsx`를 `app/components/shared/`로 이동
- [ ] `SidebarDrawer.tsx`를 `app/components/shared/`로 이동
- [ ] `app/features/dashboard/pages/home-page.tsx`의 import 경로 수정

### Step 2: 모바일 헤더 및 네비게이션 구성

- [ ] **`app/features/history/pages/history-page.tsx` 수정**
  - `MobileHeader` 추가 (우측에 Filter 아이콘 포함)
  - `SidebarDrawer` 추가
  - `isSidebarOpen` 상태 추가
  - 기존 `Sidebar`에 `hidden md:flex` 적용

### Step 3: 검색바 반응형 처리

- [ ] 모바일 전용 검색바 추가 (`md:hidden`)
- [ ] 데스크탑 검색바에 `hidden md:block` 적용

### Step 4: 카드 그리드 및 UI 반응형 처리

- [ ] 그리드 레이아웃에 반응형 클래스 적용
- [ ] 모바일 카드 스타일 적용:
  - 좌측 정렬
  - 원형 레벨 뱃지
  - `<ruby>` 태그로 후리가나 표시
  - Edit/Delete 버튼 숨김 (`md:group-hover:opacity-100`)

### Step 5: 모바일 필터 Bottom Sheet 구현

- [ ] `MobileFilterSheet` 컴포넌트 생성 (`app/features/history/components/`)
- [ ] 기존 `useWordFilter` 훅과 연결
- [ ] Sort By, Created At, JLPT Level 섹션 구현
- [ ] Reset, Show Results 버튼 동작 구현

### Step 6: FAB 추가 (hidden)

- [ ] FAB 버튼 UI 추가 (`hidden` 클래스 적용)
- [ ] 추후 기능 구현 시 활성화

---

## 4. 검증 시나리오 (Verification)

1.  **Mobile View (F12 -> iPhone SE/12)**:
    - 1열로 카드가 쭉 나열되는가?
    - 햄버거 메뉴를 누르면 사이드바가 부드럽게 열리는가?
    - 검색바가 헤더 아래에 별도로 표시되는가?
    - 필터 아이콘 클릭 시 Bottom Sheet가 열리는가?
    - 필터 적용 후 결과가 올바르게 반영되는가?
    - FAB 버튼이 보이지 않는가? (hidden 상태)
2.  **Desktop View**:
    - 기존의 4열 그리드와 사이드바가 깨지지 않고 그대로 유지되는가?
    - 기존 필터 드롭다운이 정상 동작하는가?
