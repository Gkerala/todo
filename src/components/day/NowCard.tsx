import { emojiOf, type NowAndNext } from "@/lib/dayItems";
import { formatDuration } from "@/lib/time";
import styles from "./day.module.css";

/** 맨 위 "지금 할 일" 큰 카드: 제목, 남은 시간, 진행 막대 + 다음 일정 한 줄 */
export default function NowCard({ current, next }: NowAndNext) {
  const percent = current ? Math.round(Math.min(1, Math.max(0, current.progress)) * 100) : 0;

  return (
    <section className={styles.nowCard} aria-label="지금 할 일">
      <p className={styles.nowLabel}>지금 할 일</p>
      {current ? (
        <>
          <h1 className={styles.nowTitle}>
            {emojiOf(current.item)} {current.item.title}
          </h1>
          <p className={styles.nowRemaining}>
            <strong>{current.remaining}</strong>분 남음
          </p>
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div className={styles.progressFill} style={{ width: `${percent}%` }} />
          </div>
        </>
      ) : (
        <h1 className={styles.nowTitle}>지금은 예정된 일이 없어요</h1>
      )}
      <p className={styles.nextLine}>
        {next ? (
          <>
            다음 · <strong>{next.item.start}</strong> {emojiOf(next.item)} {next.item.title} (
            {formatDuration(next.inMinutes)} 후)
          </>
        ) : (
          "오늘 남은 일정이 없어요"
        )}
      </p>
    </section>
  );
}
