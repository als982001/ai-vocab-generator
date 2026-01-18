import type { Config } from "@react-router/dev/config";
 import { vercelPreset } from "@vercel/react-router/vite";

export default {
  presets: [vercelPreset()], // 버셀 배포를 위해 주석 해제 권장
  ssr: false,                // SPA 모드 활성화
  // prerender: ["/", "/history", "/login"], // SPA 모드 확인을 위해 잠시 주석 처리
} satisfies Config;
