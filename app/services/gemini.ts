// 2. 이미지를 AI가 이해할 수 있는 포맷(Base64)으로 변환하는 헬퍼 함수
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

// 3. 실제 AI 호출 함수
export const analyzeImage = async (file: File) => {
  // 1. 파일을 Base64로 변환 (기존 함수 활용)
  const imagePart = await fileToGenerativePart(file);
  const base64Data = imagePart.inlineData.data;

  // 2. 내 Vercel 서버로 요청 (API 키 필요 없음!)
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64Data }),
  });

  if (!response.ok) throw new Error("분석 실패");

  return await response.json();
};
