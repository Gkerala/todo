"use client";

import { useActionState } from "react";
import { setupAction } from "@/app/actions";
import SubmitButton from "./SubmitButton";
import styles from "./onboarding.module.css";

/** 처음 시작 화면: 기상/취침 시간 두 가지만 묻고 기본 루틴을 만든다 */
export default function Onboarding() {
  const [state, formAction] = useActionState(setupAction, undefined);

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>안녕하세요! 저는 당신의 1:1 코치예요 🧭</h1>
      <p className={styles.lead}>
        두 가지만 알려 주면 하루 기본 루틴을 만들어 드릴게요.
        <br />
        만든 뒤에 마음대로 고칠 수 있어요.
      </p>
      <form action={formAction} className={styles.form}>
        <label className={styles.field}>
          몇 시에 일어나요?
          <input type="time" name="wake" defaultValue="07:00" required />
        </label>
        <label className={styles.field}>
          몇 시에 자요?
          <input type="time" name="sleep" defaultValue="23:00" required />
        </label>
        {state?.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}
        <SubmitButton className={styles.primary}>기본 루틴 만들기</SubmitButton>
      </form>
    </section>
  );
}
