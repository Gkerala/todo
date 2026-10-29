"use client";

import { useActionState } from "react";
import { addTodoAction } from "@/app/actions";
import SubmitButton from "@/components/SubmitButton";
import styles from "./day.module.css";

/** 그날만 하는 할 일 추가. 시간은 비워도 된다. */
export default function AddTodoForm({ date }: { date: string }) {
  const [state, formAction] = useActionState(addTodoAction, undefined);

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>할 일 추가</h2>
      <form action={formAction} className={styles.addForm}>
        <input type="hidden" name="date" value={date} />
        <input name="title" placeholder="예: 병원 예약 전화" aria-label="할 일 제목" required maxLength={100} />
        <div className={styles.timeRow}>
          <label>
            시작
            <input type="time" name="start" />
          </label>
          <label>
            끝
            <input type="time" name="end" />
          </label>
        </div>
        <p className={styles.hint}>시간은 비워도 돼요. 비우면 &lsquo;시간 없는 할 일&rsquo;로 들어가요.</p>
        {state?.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}
        <SubmitButton className={styles.primary}>추가</SubmitButton>
      </form>
    </section>
  );
}
