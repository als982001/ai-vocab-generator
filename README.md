# 📸 Snap-Voca (AI 단어장 생성기)

이미지에서 일본어 단어를 추출하여 한국어 번역과 발음(후리가나)이 포함된 단어장을 자동으로 생성합니다.

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
- **TXT 내보내기**: 추출된 단어장을 텍스트 파일로 다운로드

### 📚 히스토리 페이지 (`/history`)

과거에 분석한 모든 단어를 카드 형태로 확인하고 관리합니다.

<div align="center">
  <img src=".github/assets/history01.png" alt="히스토리 페이지" width="70%">
</div>

- **단어 카드 뷰**: 분석한 모든 단어를 깔끔한 카드 UI로 표시
- **정렬 기능**: 최신순, 오래된순, 난이도순(N5→N1, N1→N5) 정렬
- **필터 기능**: 연도별, JLPT 레벨별 필터링
- **단어 편집**: 뜻과 레벨 수정 가능 (실행 취소 지원)
- **단어 삭제**: 불필요한 단어 삭제 (실행 취소 지원)
- **발음 듣기**: TTS(Text-to-Speech)로 일본어 발음 청취

## 🗺️ Roadmap

- [x] MVP: 일본어 → 한국어 단어장 생성
- [x] Drag & Drop 이미지 업로드
- [x] 단어 카드 UI 구현
- [x] 실제 AI API 연동 (Google Gemini)
- [x] 히스토리 관리 기능 (LocalStorage)
- [x] TTS 발음 듣기 기능
- [ ] 다국어 지원 (영어, 중국어 등)
- [ ] PDF 파일 업로드 지원
- [ ] Anki Deck 내보내기 기능

## 📂 Directory Structure

```
/src
├── components/      # UI 컴포넌트 (Presentational)
├── containers/      # 비즈니스 로직 (Container)
├── types/           # TypeScript 타입 정의
└── mockData.ts      # 테스트용 데이터
```
