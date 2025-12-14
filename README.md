# 📸 Snap-Voca (AI 다국어 단어장 생성기)

이미지를 업로드하면 AI가 이미지 내의 단어를 추출하여, 번역과 발음 정보가 포함된 단어장을 자동으로 생성해주는 서비스입니다.

**📌 언어 선택 기능**: 추출할 언어와 번역할 언어를 선택할 수 있습니다.
**🚧 현재 상태**: MVP 구현 중 (일본어 → 한국어 단어장 생성)

## 🛠 Tech Stack

- **Framework:** React (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Prototyping:** Stitch (Initial UI Composition)

## ✨ Features (Current Status)

- **Image Upload:** Drag & Drop을 통한 직관적인 이미지 업로드
- **Mock Analysis:** 실제 AI 연동 전, 로딩 및 결과 화면 시뮬레이션 구현
- **Result View:** 추출된 단어 카드 리스트 뷰 (반응형 디자인 적용)

## 📂 Directory Structure

/src
├── components # UI 컴포넌트 (Presentational)
├── containers # 비즈니스 로직 (Container)
├── pages # 페이지 단위
└── mockData.ts # 테스트용 데이터
