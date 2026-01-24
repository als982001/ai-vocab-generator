# 🚀 Feature Implementation Plan: Image Coordinate Highlighting

## 1. 개요 (Overview)

- **목표**: 사용자가 업로드한 이미지에서 추출된 단어의 위치(Bounding Box)를 시각적으로 표시하고, 리스트와의 양방향 상호작용(Hover Interaction)을 구현한다.
- **핵심 가치**: 단순 텍스트 나열이 아닌, 이미지와 텍스트가 연결된 입체적인 학습 경험 제공.

## 2. 기술 명세 (Technical Specs)

- **좌표 시스템**: Gemini API로부터 `[ymin, xmin, ymax, xmax]` (Scale: 0~1000) 형식으로 받음.
- **렌더링 방식**: 원본 이미지 위에 `absolute` 포지션의 `div` 오버레이를 씌워 표시.
  - CSS 계산식: `top: ${ymin / 10}%`, `left: ${xmin / 10}%`, ... (1000분율을 백분율로 변환)
- **상호작용 (Interaction)**:
  - `hoveredWordIndex` 상태(State)를 상위 컨테이너로 끌어올려(Lift State Up), 이미지 박스와 단어 리스트가 상태를 공유하도록 함.

---

## 3. 단계별 구현 계획 (Step-by-Step Tasks)

### Step 1: 데이터 타입 정의 및 프롬프트 수정

- [x] **`app/types/index.ts` 수정** ✅ 완료
  - `IWord` 인터페이스에 `box_2d?: number[]` 속성 추가.
- [x] **`app/services/gemini.ts` 수정** (로컬 환경용) ✅ 완료
  - Gemini 프롬프트를 수정하여 `box_2d` (0~1000 scale) 데이터를 JSON 응답에 포함하도록 요청. (JSON 파싱 로직 확인)
- [x] **`api/analyze.js` 수정** (배포 환경용) ✅ 완료
  - Gemini 프롬프트를 수정하여 `box_2d` (0~1000 scale) 데이터를 JSON 응답에 포함하도록 요청. (JSON 파싱 로직 확인)

### Step 2: Bounding Box 오버레이 컴포넌트 제작

- [x] **`app/features/dashboard/components/ImageOverlay.tsx` 생성 (신규)** ✅ 완료
  - **Props**: `imageSrc` (string), `words` (IWord[]), `hoveredIndex` (number | null), `onHover` (function).
  - **구현 로직**:
    - 이미지를 배경으로 깔고, 그 위에 `relative` 부모와 `absolute` 자식 `div`들을 배치.
    - `box_2d` 좌표(0~1000)를 CSS `%` 단위로 변환하여 스타일 적용.
    - Tailwind CSS: 기본은 투명하거나 옅은 테두리, `hoveredIndex`와 일치할 때 진한 테두리(`border-red-500`) 및 배경색 강조.

### Step 3: 컨테이너 상태 관리 및 통합

- [ ] **`app/containers/DashboardContainer.tsx` (또는 해당 페이지) 수정**
  - `hoveredWordIndex` 상태 추가 (`useState<number | null>(null)`).
  - 기존의 단순 `img` 태그를 새로 만든 `ImageOverlay` 컴포넌트로 교체.
  - 단어 리스트 컴포넌트(`WordList` 등)에 `onHover` 이벤트를 전달하여, 리스트에 마우스를 올렸을 때도 `hoveredWordIndex`가 업데이트되도록 연결.

### Step 4: UI 디테일 및 모바일 대응

- [ ] **반응형 처리**: 이미지가 리사이징되어도 박스 위치가 어긋나지 않는지 확인 (CSS `%` 단위 사용 시 자동 해결되나 확인 필요).
- [ ] **스타일링**: 박스에 마우스 오버 시 `cursor-pointer` 적용 및 부드러운 전환 효과(`transition`) 추가.

---

## 4. 검증 시나리오 (Verification)

1. 이미지를 업로드하고 분석 요청 시 에러 없이 결과가 나오는가?
2. 결과 화면에서 이미지 위에 빨간(또는 지정된 색) 박스가 단어 위치에 맞게 그려지는가?
3. 오른쪽 리스트의 단어에 마우스를 올리면, 왼쪽 이미지의 해당 박스가 하이라이트 되는가?
4. 반대로 이미지의 박스에 마우스를 올리면, 오른쪽 리스트의 해당 단어도 함께 하이라이트 되는가? (양방향 연동)
