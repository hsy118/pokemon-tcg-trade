"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "./useAuth";

export function LoginView() {
  const { error, isLoading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await signIn(email, password);
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div>
          <span className="brand__eyebrow">Cardfolio access</span>
          <h2 className="auth-card__title">내 카드 앨범 열기</h2>
          <p className="section__description">
            Supabase에 등록된 이메일과 비밀번호로 로그인하면 재고와 거래 기록을 불러옵니다.
          </p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">이메일</label>
            <input
              autoComplete="email"
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">비밀번호</label>
            <input
              autoComplete="current-password"
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button button--primary" disabled={isLoading} type="submit">
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </section>
    </main>
  );
}
