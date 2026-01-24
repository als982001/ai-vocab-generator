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
