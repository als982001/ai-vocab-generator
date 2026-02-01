# 🚀 Feature Implementation Plan: Export Options (CSV & TXT)

## 1. 개요 (Overview)

- **목표**: 기존의 단일 'TXT 다운로드' 버튼을 **'다운로드 옵션 드롭다운 메뉴'**로 업그레이드하고, **CSV 내보내기** 기능을 추가한다.
- **주요 변경점**:
  1. **UI**: 화면 최하단에 위치하므로, 메뉴가 위쪽으로 열리는 **Upward Dropdown (Popover)** 구현.
  2. **Logic**: Excel 및 Anki와의 호환성을 위해 **UTF-8 BOM**이 포함된 CSV 생성 로직 구현.

---

## 2. 기술 명세 (Technical Specs)

### A. UI: Dropdown Menu Component

- **위치**: `ResultPanel` 하단 (데스크탑 전용, 모바일은 추후 구현).
- **동작 방식**:
  - "Download / Export" 버튼 클릭 시 -> 메뉴가 버튼 **위쪽(bottom: 100%)**에 나타남.
  - 메뉴 외부 영역 클릭 시 닫힘 (Click Outside Handler).
- **스타일링 (Tailwind CSS)**:
  - **Trigger Button**: `w-full`, 검은색 배경(`bg-primary/black`), 둥근 모서리(`rounded-xl`), 우측에 `ChevronUp` 아이콘.
  - **Menu List**: 흰색 배경, 그림자(`shadow-lg`), 테두리(`border`), 버튼과 동일한 너비, 버튼 위에 띄움 (`absolute bottom-full mb-2`).

### B. Logic: CSV Generation (UTF-8 w/ BOM)

- **데이터 포맷**:

  ```csv
  Word,Reading,Meaning,Level
  猫,ねこ,고양이,N5
  ...
  ```

- 참고 사항
  - BOM 추가: 파일 내용 맨 앞에 \uFEFF를 추가하여 엑셀에서 한글/일본어 깨짐 방지.
  - Escaping: 데이터 내부에 쉼표(,)나 줄바꿈이 있을 경우를 대비해, 각 필드를 큰따옴표(")로 감싸야 함.
    - 예: Meaning: "절호, 가장 좋음" -> CSV: ...,"절호, 가장 좋음",...

## 3. 단계별 구현 계획 (Step-by-Step Tasks)

### Step 1: 내보내기 유틸리티 함수 구현

### Step 2: DownloadDropdown 컴포넌트 개발

### Step 3: 기존 화면에 통합 (Integration)

## 4. 검증 시나리오

### UI 테스트

- [ ] 버튼 클릭 시 메뉴가 **위쪽**으로 열리는가?
- [ ] 메누 바깥을 클릭하면 메뉴가 닫히는가?

### CSV 호환성 테스트

- [ ] 다운로드한 .csv 파일을 클릭해서 Excel로 열었을 때, 일본어(漢字)와 한글 뜻이 깨지지 않고 올바르게 보이는가? (BOM 작동 확인)
