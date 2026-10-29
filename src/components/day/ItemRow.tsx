import {
  checkRoutineAction,
  deleteTodoAction,
  toggleTodoAction,
  uncheckRoutineAction,
} from "@/app/actions";
import SubmitButton from "@/components/SubmitButton";
import { emojiOf, type DayItem } from "@/lib/dayItems";
import styles from "./day.module.css";

type Props = { item: DayItem; date: string; canCheck: boolean };

/** 시간표 한 줄: 시간, 제목, 완료 버튼 (식사는 음식 메모, 운동은 시간(분)도 함께 기록) */
export default function ItemRow({ item, date, canCheck }: Props) {
  return (
    <li className={`${styles.item} ${item.done ? styles.done : ""}`}>
      <div className={styles.time}>
        {item.start ?? "—"}
        {item.end && <span className={styles.timeEnd}>~{item.end}</span>}
      </div>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <span aria-hidden>{emojiOf(item)}</span>
          <span className={styles.itemTitle}>{item.title}</span>
          {item.mustDo && <span className={styles.badge}>꼭</span>}
        </div>
        {item.check && (item.check.minutes !== null || item.check.memo) && (
          <p className={styles.note}>
            {[item.check.minutes !== null ? `${item.check.minutes}분` : null, item.check.memo]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {item.type === "routine" ? (
          <RoutineControls item={item} date={date} canCheck={canCheck} />
        ) : (
          <TodoControls item={item} />
        )}
      </div>
    </li>
  );
}

function RoutineControls({ item, date, canCheck }: Props) {
  if (item.done) {
    return (
      <form action={uncheckRoutineAction.bind(null, item.id, date)} className={styles.controls}>
        <SubmitButton className={styles.doneButton}>✓ 완료 · 취소하기</SubmitButton>
      </form>
    );
  }
  if (!canCheck) return <p className={styles.future}>아직 오지 않은 날이에요</p>;

  return (
    <form action={checkRoutineAction.bind(null, item.id, date)} className={styles.controls}>
      {item.kind === "meal" && (
        <input name="memo" placeholder="무엇을 먹었나요? (선택)" maxLength={200} aria-label="먹은 음식" />
      )}
      {item.kind === "exercise" && (
        <>
          <input
            name="minutes"
            type="number"
            min={0}
            max={1440}
            inputMode="numeric"
            placeholder="몇 분?"
            aria-label="운동한 시간(분)"
            className={styles.minutes}
          />
          <input name="memo" placeholder="무슨 운동? (선택)" maxLength={200} aria-label="운동 종류" />
        </>
      )}
      <SubmitButton className={styles.checkButton}>완료</SubmitButton>
    </form>
  );
}

function TodoControls({ item }: { item: DayItem }) {
  return (
    <div className={styles.controls}>
      <form action={toggleTodoAction.bind(null, item.id, !item.done)}>
        <SubmitButton className={item.done ? styles.doneButton : styles.checkButton}>
          {item.done ? "✓ 완료 · 취소하기" : "완료"}
        </SubmitButton>
      </form>
      <form action={deleteTodoAction.bind(null, item.id)}>
        <SubmitButton className={styles.deleteButton} aria-label={`'${item.title}' 삭제`}>
          삭제
        </SubmitButton>
      </form>
    </div>
  );
}
