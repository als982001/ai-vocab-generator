import { Link } from "react-router";
import type { Route } from "./+types/login-page";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "로그인 | Snap-Voca" },
    { name: "description", content: "Snap-Voca에 로그인하세요" },
  ];
};

export default function LoginPage() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: 로그인 로직 구현
    console.log("로그인 시도");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Snap Voca
            </h1>
            <p className="text-text-secondary text-sm">
              AI 일본어 단어장 생성기
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-text-primary mb-2"
              >
                이메일
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-text-primary mb-2"
              >
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-full transition-all shadow-lg hover:shadow-xl"
            >
              로그인
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-text-secondary text-sm hover:text-text-primary underline"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>

        <p className="text-center text-text-secondary text-xs mt-8">
          © 2024 Snap-Voca. All rights reserved.
        </p>
      </div>
    </div>
  );
}
