import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // 홈 페이지 (대시보드)
  index("./features/dashboard/pages/home-page.tsx"),

  // 히스토리 페이지
  route("/history", "./features/history/pages/history-page.tsx"),

  // 로그인 페이지
  route("/login", "./features/auth/pages/login-page.tsx"),
] satisfies RouteConfig;
