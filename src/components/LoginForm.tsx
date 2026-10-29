"use client";

import { useActionState } from "react";
import { authAction } from "@/app/login/actions";
import SubmitButton from "./SubmitButton";
import styles from "./onboarding.module.css";

/** 이메일 + 비밀번호 로그인/회원가입. 어느 버튼을 눌렀는지(intent)로 구분한다. */
export default function LoginForm() {
  const [state, formAction] = useActionState(authAction, undefined);

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>로그인 🧭</h1>
      <p className={styles.lead}>내 루틴과 기록은 나만 볼 수 있어요.</p>
      <form action={formAction} className={styles.form}>
        <label className={styles.field}>
          이메일
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label className={styles.field}>
          비밀번호 (8자 이상)
          <input type="password" name="password" autoComplete="current-password" minLength={8} required />
        </label>
        {state?.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}
        <SubmitButton name="intent" value="signin" className={styles.primary}>
          로그인
        </SubmitButton>
        <SubmitButton name="intent" value="signup">
          처음이에요 · 회원가입
        </SubmitButton>
      </form>
    </section>
  );
}
