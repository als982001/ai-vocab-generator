# 리팩토링 계획

> **이번 세션 범위**: 커스텀 훅 추출 + FilterDropdown 컴포넌트 분리에 집중.
> JlptLevelSelector, YearSelector, WordCardGrid, ErrorBoundary 등 대규모 공용화는 이번 세션 범위 외.

---

# (analyzer 원본)

## 분석 요약

Snap-Voca 프로젝트의 전체 코드를 분석한 결과, 다음과 같은 리팩토링 기회를 발견했습니다:

- **홈 페이지 (home-page.tsx)**: 232줄, 복잡한 상태 관리 및 이벤트 핸들러
- **히스토리 페이지 (history-page.tsx)**: 542줄, 매우 긴 페이지 컴포넌트
- **UI 컴포넌트들**: 중복되는 JLPT 레벨/연도 선택 UI
- **Sidebar**: 195줄, 프로필 섹션 로직이 복잡

현재 커스텀 훅 구조는 잘 정리되어 있으며 (useWordEdit, useWordFilter, useAnalysisHistory 등), Props 타입 정의도 양호합니다. 주요 개선점은 복잡한 컴포넌트 분해와 중복 UI 통합입니다.

---

## 커스텀 훅 추출 대상

### 1. `useImageAnalysis` (home-page.tsx에서 추출)

**대상 코드**: home-page.tsx의 이미지 업로드/분석 로직
**줄 수**: 약 35줄 (handleImageUpload, 관련 useEffect)
**목적**: 이미지 분석 로직과 Supabase 저장을 분리

```typescript
// 포함할 기능
- uploadedImage 상태 관리
- isAnalyzing 상태 관리
- handleImageUpload 핸들러
- URL cleanup useEffect
- analyzeImage API 호출 및 에러 처리
```

**구현 위치**: `app/features/dashboard/hooks/useImageAnalysis.ts`

**반환값**:

```typescript
{
  uploadedImage: IUploadedImage | null;
  isAnalyzing: boolean;
  handleImageUpload: (image: IUploadedImage | null) => Promise<void>;
}
```

---

### 2. `useImageScroll` (home-page.tsx에서 추출)

**대상 코드**: handleWordCardClick 메서드
**줄 수**: 약 20줄
**목적**: 이미지 스크롤 계산 로직을 순수 함수 훅으로 변환

```typescript
// 포함할 기능
- imageContainerRef 관리
- ymin 좌표를 실제 픽셀로 변환하는 로직
- 스크롤 타겟 계산
```

**구현 위치**: `app/features/dashboard/hooks/useImageScroll.ts`

**사용 예**:

```typescript
const { imageContainerRef, scrollToWord } = useImageScroll();
// 컴포넌트에서: scrollToWord(word.box_2d[0], words)
```

---

### 3. `useHighlightWord` (home-page.tsx에서 추출)

**대상 코드**: highlightedWord, highlightTimerRef 관련 로직
**줄 수**: 약 15줄
**목적**: 단어 하이라이트 타이머 관리를 분리

```typescript
// 포함할 기능
- highlightedWord 상태
- highlightTimerRef 관리
- handleWordClick 핸들러
- cleanup useEffect (타이머 정리)
```

**구현 위치**: `app/features/dashboard/hooks/useHighlightWord.ts`

**반환값**:

```typescript
{
  highlightedWord: string | null;
  handleWordClick: (wordStr: string) => void;
}
```

---

## 컴포넌트 분리 대상

### 1. `SearchBar` (history-page.tsx에서 추출)

**대상**: 검색 기능 (모바일/데스크톱)
**현재 위치**: history-page.tsx의 lines 237-357 (중복된 구현)
**분리 후 크기**: ~80줄
**기준**: 검색 입력과 검색 로직이 별도 관심사

**분리 이유**:

- 모바일과 데스크톱에서 유사한 검색 UI 반복
- 검색 로직 (searchInput, searchQuery, handleSearchKeyDown)이 별도 관심사

**새 컴포넌트**:

```typescript
// app/features/history/components/SearchBar.tsx
interface ISearchBarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: (query: string) => void;
}
export function SearchBar({
  searchInput,
  onSearchInputChange,
  onSearch,
}: ISearchBarProps) {
  // 모바일/데스크톱 통합 구현
}
```

---

### 2. `FilterDropdown` (history-page.tsx에서 추출)

**대상**: 데스크톱 필터 패널 (lines 397-493)
**현재 크기**: ~100줄
**분리 후 크기**: ~80줄
**기준**: 복잡한 조건부 렌더링

**분리 이유**:

- MobileFilterSheet와 구조가 유사하지만 분리되어 있음
- 복잡한 조건부 렌더링 (isFilterOpen, AnimatePresence, motion.div 등)
- 필터 패널이 독립적인 UI 모듈

**새 컴포넌트**:

```typescript
// app/features/history/components/FilterDropdown.tsx
interface IFilterDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedYear: number | null;
  onYearChange: (year: number) => void;
  selectedLevels: JlptLevel[];
  onLevelChange: (level: JlptLevel) => void;
  onReset: () => void;
}
export function FilterDropdown({
  isOpen,
  onToggle,
  // ... props
}: IFilterDropdownProps) {
  // 데스크톱 필터 패널 구현
}
```

---

### 3. `WordCardGrid` (history-page.tsx에서 추출)

**대상**: 카드 그리드 렌더링 (lines 497-529)
**현재 크기**: ~35줄
**분리 후 크기**: ~30줄
**기준**: ResponsiveGrid 로직

**분리 이유**:

- 데스크톱/모바일 레이아웃 분리
- AnimatedViewportItem 래핑 로직
- 향후 무한 스크롤 구현 시 수정 포인트 단순화

**새 컴포넌트**:

```typescript
// app/features/history/components/WordCardGrid.tsx
interface IWordCardGridProps {
  words: IWordWithDate[];
  isEditing: (word: IWordWithDate) => boolean;
  // ... edit handlers
}
export function WordCardGrid({
  words,
  // ... props
}: IWordCardGridProps) {
  // 데스크톱 그리드 + 모바일 리스트 구현
}
```

---

### 4. `SidebarProfile` (Sidebar.tsx에서 추출)

**대상**: 프로필 섹션 (lines 156-192)
**현재 크기**: ~37줄
**분리 후 크기**: ~30줄
**기준**: 프로필 관심사 분리

**분리 이유**:

- URL 검증 로직이 복잡 (try-catch, URL validation)
- Sidebar의 여러 관심사 중 하나
- 프로필 정보 표시가 독립적인 모듈

**새 컴포넌트**:

```typescript
// app/components/shared/SidebarProfile.tsx
interface ISidebarProfileProps {
  user: User | null;
  onSignOut: () => void;
}
export function SidebarProfile({ user, onSignOut }: ISidebarProfileProps) {
  // URL 검증 + 프로필 표시
}
```

---

## 중복 코드 통합 (우선순위: 높음)

### 1. `JlptLevelSelector` 컴포넌트 추출

**현재 중복 위치** (4곳):

1. Sidebar.tsx (lines 101-122): 필터 선택 UI
2. history-page.tsx (lines 464-478): 필터 패널 내 레벨 선택
3. MobileFilterSheet.tsx (lines 125-140): 모바일 필터 내 레벨 선택
4. DesktopWordCard.tsx (lines 40-52): 편집 모드 레벨 선택

**중복 정도**: 각 구현마다 다른 스타일, 같은 로직
**분리 효과**: 4개 중복 코드 제거

**새 컴포넌트**:

```typescript
// app/components/shared/JlptLevelSelector.tsx
interface IJlptLevelSelectorProps {
  selectedLevels: JlptLevel[];
  onLevelChange: (level: JlptLevel) => void;
  variant?: "button" | "pill" | "circle" | "inline"; // 다양한 스타일 지원
  className?: string;
}

export function JlptLevelSelector({
  selectedLevels,
  onLevelChange,
  variant = "button",
  className,
}: IJlptLevelSelectorProps) {
  // 4가지 스타일 모두 대응
}
```

**사용 예**:

```typescript
// Sidebar에서
<JlptLevelSelector
  selectedLevels={selectedLevels}
  onLevelChange={onLevelToggle}
  variant="button"
/>

// DesktopWordCard에서
<JlptLevelSelector
  selectedLevels={[editedLevel]}
  onLevelChange={(level) => onEditedLevelChange(level)}
  variant="pill"
/>
```

---

### 2. `YearSelector` 컴포넌트 추출

**현재 중복 위치** (2곳):

1. history-page.tsx (lines 432-452): 데스크톱 필터
2. MobileFilterSheet.tsx (lines 93-114): 모바일 필터

**중복 정도**: 거의 동일한 로직, 스타일만 다름
**분리 효과**: 2개 중복 코드 제거

**새 컴포넌트**:

```typescript
// app/components/shared/YearSelector.tsx
interface IYearSelectorProps {
  selectedYear: number | null;
  onYearChange: (year: number) => void;
  years?: number[]; // 기본값: [2025, 2026]
  variant?: "button" | "pill"; // 스타일 변형
}

export function YearSelector({
  selectedYear,
  onYearChange,
  years = [2025, 2026],
  variant = "button",
}: IYearSelectorProps) {
  // 년도 선택 로직
}
```

---

## 기타 개선 포인트

### 1. Props 드릴링 최적화 (우선순위: 중간)

**현재 상황**:

- home-page.tsx → ImageUploader, ResultPanel에 많은 props 전달 (8-10개)
- history-page.tsx → DesktopWordCard, MobileWordCard에 많은 props 전달

**영향받는 컴포넌트들**:

```
home-page.tsx의 props (현재):
- uploadedImage, onImageUpload, isAnalyzing, words, hoveredWord, onHover, onWordClick, imageContainerRef
- words, displayOptions, onDownloadTxt, onDownloadCsv, hoveredWord, onHover, onWordCardClick, highlightedWord, enableAnimation

history-page.tsx의 props (현재):
- word, isEditing, editedMeaning, editedLevel, showFurigana, onEditedMeaningChange, onEditedLevelChange, onSaveEdit, onCancelEdit, onStartEdit, onDeleteWord
```

**개선 옵션**:

**Option A (단기)**: Props 객체화로 가독성 개선

```typescript
// Before
<ImageUploader
  uploadedImage={uploadedImage}
  onImageUpload={onImageUpload}
  isAnalyzing={isAnalyzing}
  words={words}
  hoveredWord={hoveredWord}
  onHover={onHover}
  onWordClick={onWordClick}
  imageContainerRef={imageContainerRef}
/>

// After
<ImageUploader
  image={{ uploadedImage, onImageUpload, isAnalyzing }}
  words={{ items: words, hoveredWord, onHover, onWordClick }}
  containerRef={imageContainerRef}
/>
```

**Option B (장기)**: Context API 도입

```typescript
// DashboardContext - displayOptions, selectedLevels 같은 공유 상태
// HistoryFilterContext - 검색, 필터, 정렬 상태
```

**권장**: 현재는 Option A로 즉시 가독성 개선, 향후 필요시 Context API 도입

---

### 2. 에러 경계 추가 (우선순위: 중간)

**현재 상황**: 에러 처리가 toast 메시지 수준

```typescript
// home-page.tsx line 158-160
catch (error) {
  console.error(error);
  toast.error("이미지 분석에 실패했습니다. 다시 시도해주세요.");
}
```

**개선안**: ErrorBoundary 컴포넌트 추가

```typescript
// app/components/shared/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  // React Error Boundary 구현
}

// home-page.tsx에서 사용
<ErrorBoundary>
  <ImageUploader {...props} />
</ErrorBoundary>
```

---

### 3. 로딩 상태 컴포넌트 (우선순위: 낮음)

**현재 위치**: ImageUploader.tsx (lines 119-139)
**평가**: 구현이 이미 깔끔함

**현재 코드가 양호한 이유**:

- LOADING_MESSAGES 상수로 관심사 분리
- AnimatePresence + motion으로 부드러운 애니메이션
- 로딩 메시지 자동 전환 (3초 간격)

**결론**: 유지 권장 (별도 추출 불필요)

---

### 4. 이미지 좌표 계산 로직 (우선순위: 낮음)

**현재 위치**: ImageOverlay.tsx (lines 26-56)
**평가**: 구현이 간단하고 명확함

**현재 코드가 양호한 이유**:

- 계산 로직이 간단하고 이해하기 쉬움
- 컴포넌트에 2-3줄의 간단한 계산만 포함
- box_2d 변환 로직이 명확함

**결론**: 유지 권장

---

## 구현 우선순위 및 로드맵

### Phase 1 (즉시 시작 - 1~2일 소요)

**효과**: 중복 코드 제거, 가독성 향상

1. ✅ `JlptLevelSelector` 컴포넌트 추출
   - 4개 위치의 중복 제거
   - variant props로 다양한 스타일 지원

2. ✅ `YearSelector` 컴포넌트 추출
   - 2개 위치의 중복 제거

3. ✅ `SidebarProfile` 컴포넌트 분리
   - Sidebar.tsx 간결화

**예상 효과**:

- 약 100줄의 중복 코드 제거
- Sidebar.tsx를 150줄 이하로 축소

---

### Phase 2 (1주일 이후)

**효과**: 복잡한 로직 분리, 컴포넌트 간결화

4. ✅ `useImageAnalysis` 훅 추출
   - home-page.tsx 간결화

5. ✅ `useHighlightWord` 훅 추출
   - 타이머 관리 로직 분리

6. ✅ `useImageScroll` 훅 추출
   - 스크롤 계산 로직 분리

7. ✅ `SearchBar` 컴포넌트 분리
   - 검색 UI 통합

**예상 효과**:

- home-page.tsx를 ~150줄로 축소
- 비즈니스 로직과 UI의 명확한 분리

---

### Phase 3 (필요시)

**효과**: 추가 최적화

8. ⚪ `FilterDropdown` 컴포넌트 분리
   - history-page.tsx의 복잡한 필터 UI 분리

9. ⚪ `WordCardGrid` 컴포넌트 분리
   - 카드 렌더링 로직 분리

10. ⚪ Props 드릴링 최적화
    - Context API 또는 Props 객체화

11. ⚪ ErrorBoundary 추가
    - 에러 처리 강화

---

## 현재 우수 사항 (유지하기)

- ✅ **커스텀 훅 구조**: useWordEdit, useWordFilter, useAnalysisHistory, useWordMutations, useSaveAnalysis가 이미 잘 정리됨
- ✅ **Props 타입 정의**: I로 시작하는 인터페이스 네이밍 컨벤션 일관되게 유지 중
- ✅ **Feature별 디렉토리**: app/features/[feature]/ 구조로 기능별 관심사 명확
- ✅ **API 서비스 분리**: services/ 폴더에서 Gemini, Supabase, TTS 등 분리
- ✅ **유틸 함수 분리**: utils/ 폴더에서 date, jlpt, animation 등 분리
- ✅ **Constant 관리**: constants/, features/[feature]/constants/ 등 적절히 분리

---

## 주의사항

### 1. 마이그레이션 시 테스트

리팩토링 후 다음 기능 테스트 필수:

- 이미지 업로드 및 분석 기능
- 단어 카드 클릭 시 스크롤 및 하이라이트
- 히스토리 페이지 검색 및 필터링
- 반응형 레이아웃 (모바일/데스크톱)

### 2. Git 커밋 전략

- Phase 1의 중복 코드 제거: 1개의 스쿼시 커밋
- Phase 2의 훅 추출: 각 훅당 1개 커밋 (관련 컴포넌트 수정 포함)
- 컴포넌트 분리: 각 컴포넌트당 1개 커밋

### 3. Props 네이밍 컨벤션

- Props 인터페이스: `I[ComponentName]Props` 형식 유지
- Props 객체: 기존 객체 구조 그대로 사용 (예: `image`, `words` 객체화 시에도)

---

## 참고: 마이그레이션 예시

### useImageAnalysis 추출 예시

**Before** (home-page.tsx 일부):

```typescript
const [uploadedImage, setUploadedImage] = useState<IUploadedImage | null>(null);
const [isAnalyzing, setIsAnalyzing] = useState(false);

const handleImageUpload = async (image: IUploadedImage | null) => {
  if (uploadedImage?.preview) {
    URL.revokeObjectURL(uploadedImage.preview);
  }
  setUploadedImage(image);
  if (image) {
    setIsAnalyzing(true);
    setWords([]);
    try {
      const analyzedWords = await analyzeImage(image.file);
      setWords(analyzedWords);
      saveAnalysis({ words: analyzedWords, imageName: image.file.name });
    } catch (error) {
      toast.error("분석 실패");
    } finally {
      setIsAnalyzing(false);
    }
  }
};

useEffect(() => {
  return () => {
    if (uploadedImage?.preview) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
  };
}, [uploadedImage]);
```

**After** (home-page.tsx):

```typescript
const { uploadedImage, isAnalyzing, handleImageUpload } = useImageAnalysis(
  words,
  setWords,
  saveAnalysis
);
```

**새 파일** (app/features/dashboard/hooks/useImageAnalysis.ts):

```typescript
export function useImageAnalysis(
  words: IWord[],
  setWords: (words: IWord[]) => void,
  saveAnalysis: (data: any) => void
) {
  const [uploadedImage, setUploadedImage] = useState<IUploadedImage | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageUpload = async (image: IUploadedImage | null) => {
    // ... 기존 로직
  };

  useEffect(() => {
    return () => {
      if (uploadedImage?.preview) {
        URL.revokeObjectURL(uploadedImage.preview);
      }
    };
  }, [uploadedImage]);

  return { uploadedImage, isAnalyzing, handleImageUpload };
}
```

---

## 마무리

이 리팩토링 계획을 단계적으로 진행하면:

- **코드 품질 향상**: 중복 제거, 로직 분리
- **유지보수성 개선**: 관심사 명확화, 컴포넌트 크기 축소
- **테스트 용이성**: 순수 함수 훅, 작은 컴포넌트
- **개발 생산성**: 재사용 가능한 컴포넌트 증가

특히 Phase 1 (중복 코드 제거)은 즉시 큰 효과를 볼 수 있으므로 우선 진행을 권장합니다.
