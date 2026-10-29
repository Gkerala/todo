import Link from "next/link";
import { WEEKDAY_LABELS, weekDates, weekdayOf } from "@/lib/time";
import styles from "./day.module.css";

/** 이번 주 7일 날짜 버튼. 주소(?date=)로 날짜를 바꿔서 새로고침해도 같은 날짜가 보인다. */
export default function WeekBar({ selected, today }: { selected: string; today: string }) {
  return (
    <nav className={styles.week} aria-label="날짜 선택">
      {weekDates(selected).map((d) => {
        const classes = [styles.day, d === selected && styles.daySelected, d === today && styles.dayToday]
          .filter(Boolean)
          .join(" ");
        return (
          <Link
            key={d}
            href={d === today ? "/" : `/?date=${d}`}
            className={classes}
            aria-current={d === selected ? "date" : undefined}
          >
            <span className={styles.dayName}>{WEEKDAY_LABELS[weekdayOf(d)]}</span>
            <span className={styles.dayNum}>{Number(d.slice(8))}</span>
          </Link>
        );
      })}
    </nav>
  );
}
