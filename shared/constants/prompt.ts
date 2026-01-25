export const ANALYZE_IMAGE_PROMPT = `
Analyze this image and extract Japanese vocabulary.
Return the result as a STRICT JSON array without markdown code blocks.

Each item should have:
- word: The Japanese word (Kanji or Kana)
- reading: Furigana reading in Hiragana/Katakana
- meaning: Meaning in Korean (한국어 뜻)
- level: Estimated JLPT level (e.g., N5, N4, N3, N2, N1)
- box_2d: The exact bounding box of where this word appears in the image.
  Format: [y_min, x_min, y_max, x_max] as normalized coordinates from 0 to 1000,
  where (0,0) is top-left corner and (1000,1000) is bottom-right corner.

Example format:
[{"word": "猫", "reading": "ねこ", "meaning": "고양이", "level": "N5", "box_2d": [150, 200, 300, 400]}]
`;

export const GEMINI_2_DOT_5_FLASH = "gemini-2.5-flash";
export const GEMINI_3_FLASH_PREVIEW = "gemini-3-flash-preview";

export const sampleData2 =
  '[\n  {"word": "被疑者", "reading": "ひぎしゃ", "meaning": "피의자", "level": "N1", "box_2d": [241, 9, 455, 88]},\n  {"word": "かたくなに", "reading": "かたくなに", "meaning": "완강히", "level": "N1", "box_2d": [267, 117, 461, 260]},\n  {"word": "供述", "reading": "きょうじゅつ", "meaning": "공술", "level": "N1", "box_2d": [267, 261, 478, 318]},\n  {"word": "拒んで", "reading": "こばんで", "meaning": "거부하여", "level": "N2", "box_2d": [294, 342, 542, 423]},\n  {"word": "いとなんで", "reading": "いとなんで", "meaning": "영위하여", "level": "N2", "box_2d": [662, 47, 856, 182]},\n  {"word": "こばんで", "reading": "こばんで", "meaning": "거절하여", "level": "N2", "box_2d": [671, 314, 856, 420]},\n  {"word": "あゆんで", "reading": "あゆんで", "meaning": "걸어서", "level": "N1", "box_2d": [679, 572, 863, 679]},\n  {"word": "つつしんで", "reading": "つつしんで", "meaning": "삼가", "level": "N1", "box_2d": [682, 832, 863, 966]}\n]';
