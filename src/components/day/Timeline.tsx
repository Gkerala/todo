import { Fragment } from "react";
import type { DayItem } from "@/lib/dayItems";
import { fromMinutes, toMinutes } from "@/lib/time";
import ItemRow from "./ItemRow";
import styles from "./day.module.css";

type Props = {
  items: DayItem[];
  date: string;
  /** 오늘이면 현재 시각(분), 아니면 null → "지금" 선을 그리지 않는다 */
  nowMinutes: number | null;
  canCheck: boolean;
};

/** 시간표: 시간순 목록 + 오늘이면 현재 시각 위치에 빨간 "지금" 선 */
export default function Timeline({ items, date, nowMinutes, canCheck }: Props) {
  if (items.length === 0) return <p className={styles.empty}>이 날은 시간이 정해진 일정이 없어요.</p>;

  // "지금" 선은 아직 시작하지 않은 첫 일정 바로 위에 넣는다 (모두 지났으면 맨 아래)
  let nowIndex = -1;
  if (nowMinutes !== null) {
    const firstUpcoming = items.findIndex((i) => toMinutes(i.start!) > nowMinutes);
    nowIndex = firstUpcoming === -1 ? items.length : firstUpcoming;
  }
  const nowLine = nowMinutes !== null && (
    <li className={styles.nowLine} aria-label="현재 시각">
      <span>지금 {fromMinutes(nowMinutes)}</span>
    </li>
  );

  return (
    <ul className={styles.list}>
      {items.map((item, i) => (
        <Fragment key={item.key}>
          {i === nowIndex && nowLine}
          <ItemRow item={item} date={date} canCheck={canCheck} />
        </Fragment>
      ))}
      {nowIndex === items.length && nowLine}
    </ul>
  );
}
