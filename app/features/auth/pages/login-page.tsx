import { useState } from "react";
import { ArrowRight, Eye, EyeOff, User } from "lucide-react";

import type { Route } from "./+types/login-page";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "로그인 | Snap-Voca" },
    { name: "description", content: "Snap-Voca에 로그인하세요" },
  ];
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: 로그인 로직 구현
    console.log("로그인 시도");
  };

  return (
    <div className="bg-[#f6f6f8] text-slate-900 h-screen overflow-hidden flex flex-col font-display">
      {/* Navbar */}
      <header className="flex items-center justify-between border-b border-solid border-slate-200 px-10 py-4 absolute top-0 w-full z-10 bg-[#f6f6f8]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="size-8 text-[#135bec]">
            <svg
              className="w-full h-full"
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Snap Voca</h1>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-sm text-[#92a4c9]">
          <span>계정이 없으신가요?</span>
          <a
            className="text-[#135bec] hover:text-white transition-colors font-bold"
            href="#"
          >
            회원가입
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center relative w-full h-full px-4">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#135bec]/20 rounded-full blur-[128px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-[96px] pointer-events-none mix-blend-screen" />

        {/* Login Card */}
        <div className="relative w-full max-w-[480px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-8 sm:p-10 z-20 backdrop-blur-sm">
          {/* Header Section */}
          <div className="flex flex-col gap-2 mb-8 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome Back
            </h2>
            <p className="text-slate-500 text-base">
              단어장을 생성하려면 로그인하세요.
            </p>
          </div>

          {/* Form Section */}
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* ID Input */}
            <div className="flex flex-col gap-2">
              <label
                className="text-sm font-semibold text-slate-700"
                htmlFor="user-id"
              >
                User ID
              </label>
              <div className="relative flex items-center">
                <input
                  className="form-input w-full rounded-lg bg-slate-50 border border-slate-300 text-slate-900 h-12 px-4 pr-12 focus:border-[#135bec] focus:ring-1 focus:ring-[#135bec] placeholder:text-slate-400 transition-all"
                  id="user-id"
                  placeholder="Enter your ID or Email"
                  type="text"
                />
                <div className="absolute right-4 text-[#92a4c9] pointer-events-none flex items-center">
                  <User size={20} />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label
                  className="text-sm font-semibold text-slate-700"
                  htmlFor="password"
                >
                  Password
                </label>
                <a
                  className="text-xs font-medium text-[#135bec] hover:text-[#1d66f0] transition-colors"
                  href="#"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative flex items-center">
                <input
                  className="form-input w-full rounded-lg bg-slate-50 border border-slate-300 text-slate-900 h-12 px-4 pr-12 focus:border-[#135bec] focus:ring-1 focus:ring-[#135bec] placeholder:text-slate-400 transition-all"
                  id="password"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                />
                <button
                  className="absolute right-4 text-[#92a4c9] hover:text-slate-900 cursor-pointer flex items-center transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              className="mt-2 w-full h-12 bg-[#135bec] hover:bg-[#1d66f0] text-white font-bold rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-[#135bec]/20 flex items-center justify-center gap-2"
              type="submit"
            >
              <span>Log In</span>
              <ArrowRight size={20} />
            </button>
          </form>

          {/* Mobile Footer Link */}
          <div className="mt-8 text-center sm:hidden">
            <span className="text-sm text-[#92a4c9]">계정이 없으신가요? </span>
            <a className="text-sm font-bold text-[#135bec]" href="#">
              회원가입
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
