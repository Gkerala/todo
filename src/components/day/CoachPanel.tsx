import type { CoachMessage } from "@/lib/coach";
import styles from "./day.module.css";

/** 코치 메시지 목록. 급한 것(꼭 지킬 것을 놓침)부터 보여 준다. */
export default function CoachPanel({ messages }: { messages: CoachMessage[] }) {
  if (messages.length === 0) return null;
  return (
    <section className={styles.coach} aria-label="코치">
      <p className={styles.coachLabel}>🧭 코치</p>
      <ul className={styles.coachList}>
        {messages.map((m) => (
          <li key={m.text} className={`${styles.coachMsg} ${styles[m.level]}`}>
            {m.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
