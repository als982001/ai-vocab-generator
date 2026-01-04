/**
 * 일본어 TTS (Text-to-Speech) 재생
 * @param text - 재생할 텍스트 (일본어)
 * @param options - 재생 옵션 (rate, pitch 등)
 * @returns Promise<void> - 재생 완료 시 resolve, 실패 시 reject
 */
export const playTTS = (
  text: string,
  options?: {
    rate?: number; // 0.1 ~ 10 (기본값: 0.8)
    pitch?: number; // 0 ~ 2 (기본값: 1)
    volume?: number; // 0 ~ 1 (기본값: 1)
  }
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 브라우저 지원 확인
    if (!window.speechSynthesis) {
      reject(new Error("TTS not supported"));
      return;
    }

    // 기존 음성 중지
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "ja-JP";
    utterance.rate = options?.rate ?? 0.8;
    utterance.pitch = options?.pitch ?? 1;
    utterance.volume = options?.volume ?? 1;

    // 일본어 음성 선택 (음성 목록 로딩 대기)
    const selectVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const japaneseVoice = voices.find((voice) => voice.lang.startsWith("ja"));

      if (japaneseVoice) {
        utterance.voice = japaneseVoice;
      }
    };

    // 음성 목록이 이미 로드된 경우
    if (window.speechSynthesis.getVoices().length > 0) {
      selectVoice();
    } else {
      // 음성 목록 로딩 대기 (특히 Chrome/Mobile에서 필요)
      window.speechSynthesis.addEventListener("voiceschanged", selectVoice, {
        once: true,
      });
    }

    // 이벤트 핸들러
    utterance.onend = () => resolve();
    utterance.onerror = (event) => {
      reject(new Error(`TTS error: ${event.error}`));
    };

    window.speechSynthesis.speak(utterance);
  });
};

/**
 * TTS 일시정지
 */
export const pauseTTS = (): void => {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
};

/**
 * TTS 재개
 */
export const resumeTTS = (): void => {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
};

/**
 * TTS 중지
 */
export const stopTTS = (): void => {
  window.speechSynthesis.cancel();
};

/**
 * TTS 재생 중인지 확인
 */
export const isTTSPlaying = (): boolean => {
  return window.speechSynthesis.speaking;
};
