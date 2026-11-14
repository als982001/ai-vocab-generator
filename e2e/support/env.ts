// webServer에 주입하는 더미 env. 실제 서비스로 요청이 나가도 인증될 수 없는 값만 쓴다.
export const E2E_SUPABASE_URL = "https://e2etest.supabase.co";

export const E2E_ENV = {
  VITE_SUPABASE_URL: E2E_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: "e2e-dummy-anon-key",
  VITE_GEMINI_API_KEY: "e2e-dummy-gemini-key",
};
