# 📱 Feature Implementation Plan: Mobile Responsiveness & Bug Fix

## 1. 개요 (Overview)

- **목표**: 윈도우 크기 조절 시 이미지 위의 Bounding Box 좌표가 어긋나는 버그를 수정하고, 추후 모바일 반응형 UI를 구축한다.
- **핵심 과제**:
  1. Image Overlay의 좌표계가 CSS 렌더링 사이즈와 1:1로 매핑되도록 구조 개선 (Coordinate Drift Fix).
  2. (추후) Tailwind CSS Breakpoint를 활용한 모바일 레이아웃 구현.

---

## 2. 기술 명세 (Technical Specs)

### 현재 파일 구조

| 파일 | 역할 |
|------|------|
| `app/features/dashboard/pages/home-page.tsx` | 메인 페이지, state 관리 |
| `app/features/dashboard/components/ImageOverlay.tsx` | 바운딩 박스 오버레이 |
| `app/features/dashboard/components/ImageUploader.tsx` | 이미지 업로드 영역 |
| `app/features/dashboard/components/ResultPanel.tsx` | 우측 단어 리스트 |

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

- [ ] **`ImageOverlay.tsx` 컴포넌트 수정**
  - `imageSize` state 및 `handleImageLoad` 로직 제거
  - 오버레이 div 스타일을 `absolute inset-0`으로 변경
  - `pointer-events-none`은 개별 박스에만 적용 (클릭 필요하므로)
  - **검증**: 브라우저 폭을 줄였다 늘렸다 했을 때 빨간 박스가 이미지 속 글자와 같이 움직이는지 확인

### Step 2: 모바일 레이아웃 구현 (추후 진행 예정)

- 모바일 디자인 시안: `mockDatas/mobile_main_screenl.png`
- Step 1 완료 후 별도 진행

---

## 4. 검증 시나리오 (Verification)

### Step 1 검증

1. **Desktop Resizing**: 데스크탑 브라우저 창을 가로로 좁게 줄였을 때, 빨간 박스가 이미지 사이즈 변화에 맞춰 정확히 줄어드는가?
2. **Box Interaction**: 박스 hover/click이 정상 동작하는가?
3. **Word Card 연동**: 박스 클릭 시 해당 단어 카드로 스크롤되는가?
