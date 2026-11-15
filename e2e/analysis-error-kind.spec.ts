// 브라우저 없이 도는 순수 함수 테스트. 화면 fixture(mocks)가 필요 없어 support/test가 아닌 기본 test를 쓴다
// 로컬 경로(브라우저 → Gemini)의 오류 분류가 서버 경로(api/analyze.js, analyze-api.spec.ts)와 같은 기준인지 고정한다
import { expect, test } from "@playwright/test";

import {
  getKindFromHttpErrorCode,
  getKindFromHttpStatus,
  getKindFromUpstreamError,
} from "../app/utils/analysisError";

// 상류(Gemini) 오류: 400 + 파일 처리 불가 메시지만 client, 나머지는 전부 server
const UPSTREAM_CASES = [
  {
    name: "400 + 파일 처리 불가",
    status: 400,
    message:
      '{"error":{"code":400,"message":"Unable to process input image. Please retry","status":"INVALID_ARGUMENT"}}',
    kind: "client",
  },
  {
    name: "400 + API 키 오류",
    status: 400,
    message:
      '{"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","details":[{"reason":"API_KEY_INVALID"}]}}',
    kind: "server",
  },
  {
    name: "그 외 400 (요청·스키마 문제)",
    status: 400,
    message:
      '{"error":{"code":400,"message":"Invalid JSON payload received.","status":"INVALID_ARGUMENT"}}',
    kind: "server",
  },
  { name: "401", status: 401, message: "", kind: "server" },
  { name: "403", status: 403, message: "", kind: "server" },
  { name: "404 (모델 없음)", status: 404, message: "", kind: "server" },
  { name: "413", status: 413, message: "", kind: "server" },
  { name: "415", status: 415, message: "", kind: "server" },
  { name: "422", status: 422, message: "", kind: "server" },
  { name: "429", status: 429, message: "", kind: "server" },
  { name: "500", status: 500, message: "", kind: "server" },
  { name: "503", status: 503, message: "", kind: "server" },
] as const;

for (const { name, status, message, kind } of UPSTREAM_CASES) {
  test(`상류 오류 분류: ${name} → ${kind}`, () => {
    expect(getKindFromUpstreamError({ status, message }).kind).toBe(kind);
  });
}

// 우리 서버·Vercel 응답 상태: 요청 내용 때문에 거부된 400·413·415·422만 client
// (플랫폼 413 = 배포 경로 4.5MB 요청 한도, docs/known-issues.md)
test("HTTP 상태 분류: 400·413·415·422만 client", () => {
  for (const status of [400, 413, 415, 422]) {
    expect(getKindFromHttpStatus({ status }).kind, `${status}`).toBe("client");
  }

  for (const status of [401, 403, 404, 405, 429, 500, 502, 503]) {
    expect(getKindFromHttpStatus({ status }).kind, `${status}`).toBe("server");
  }
});

// /api/analyze 오류 본문의 code: 요청 거부 code만 client, 알 수 없는 값은 판단 보류(null)
test("서버 오류 code 분류", () => {
  expect(getKindFromHttpErrorCode({ code: "INVALID_REQUEST" }).kind).toBe(
    "client"
  );
  expect(getKindFromHttpErrorCode({ code: "UPSTREAM_BAD_REQUEST" }).kind).toBe(
    "client"
  );

  for (const code of [
    "METHOD_NOT_ALLOWED",
    "RATE_LIMITED",
    "UPSTREAM_ERROR",
    "INTERNAL_ERROR",
  ]) {
    expect(getKindFromHttpErrorCode({ code }).kind, code).toBe("server");
  }

  for (const code of ["UNKNOWN_CODE", undefined, null, 400]) {
    expect(getKindFromHttpErrorCode({ code }).kind, String(code)).toBeNull();
  }
});
