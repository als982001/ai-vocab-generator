import type { BrowserContext } from "@playwright/test";

import { E2E_SUPABASE_URL } from "./env";

export const E2E_USER_ID = "00000000-0000-4000-8000-0000000000e2";

// supabase-js 저장 키 규칙: sb-<URL hostname 첫 마디>-auth-token
const STORAGE_KEY = `sb-${new URL(E2E_SUPABASE_URL).hostname.split(".")[0]}-auth-token`;

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * 앱이 뜨기 전에 localStorage에 가짜 Supabase 세션을 넣는다.
 * 인증 가드는 그대로 실행되고, 이 세션으로 통과한다.
 * expires_at을 먼 미래로 두어 토큰 갱신 요청이 나가지 않게 한다.
 */
export async function seedAuthSession({
  context,
}: {
  context: BrowserContext;
}) {
  const expiresAt = Math.floor(Date.now() / 1000) + ONE_YEAR_SECONDS;

  const session = {
    access_token: "e2e-access-token",
    refresh_token: "e2e-refresh-token",
    token_type: "bearer",
    expires_in: ONE_YEAR_SECONDS,
    expires_at: expiresAt,
    user: {
      id: E2E_USER_ID,
      aud: "authenticated",
      role: "authenticated",
      email: "e2e@example.test",
      app_metadata: { provider: "google" },
      // avatar_url을 넣지 않아 외부 이미지 요청이 생기지 않는다
      user_metadata: { full_name: "E2E Tester" },
      created_at: "2026-01-01T00:00:00.000Z",
    },
  };

  await context.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: JSON.stringify(session) }
  );
}
