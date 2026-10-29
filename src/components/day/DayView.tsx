"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { coach } from "@/lib/coach";
import { buildDayItems, findNowAndNext } from "@/lib/dayItems";
import { formatDateLabel, nowInAppTz } from "@/lib/time";
import type { Routine, RoutineCheck, Todo } from "@/lib/types";
import AddTodoForm from "./AddTodoForm";
import CoachPanel from "./CoachPanel";
import ItemRow from "./ItemRow";
import NowCard from "./NowCard";
import Timeline from "./Timeline";
import WeekBar from "./WeekBar";
import styles from "./day.module.css";

type Props = {
  today: string;
  selectedDate: string;
  /** 서버가 페이지를 만든 시각. 서버/브라우저 첫 화면을 똑같이 맞추려고 받는다. */
  initialNowMinutes: number;
  routines: Routine[];
  checks: RoutineCheck[];
  todayTodos: Todo[];
  selectedTodos: Todo[];
};

const REFRESH_MS = 60_000;

/** 오늘 화면 전체. 서버에서 받은 데이터로 "지금 할 일", 코치 메시지, 시간표를 계산해 보여 준다. */
export default function DayView(props: Props) {
  const { today, selectedDate, routines, checks, todayTodos, selectedTodos } = props;
  const router = useRouter();
  const [nowMinutes, setNowMinutes] = useState(props.initialNowMinutes);
  // 체크/추가 후 서버가 화면을 새로 만들면 그 시각으로 시계를 맞춘다
  const [serverNow, setServerNow] = useState(props.initialNowMinutes);
  if (serverNow !== props.initialNowMinutes) {
    setServerNow(props.initialNowMinutes);
    setNowMinutes(props.initialNowMinutes);
  }

  // 1분마다: 시계를 갱신하고(남은 시간, 코치 메시지), 서버에서 데이터도 다시 받아온다.
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMinutes(nowInAppTz().minutes);
      router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);

  const isToday = selectedDate === today;
  const todayItems = buildDayItems(today, routines, checks, todayTodos);
  const selectedItems = isToday ? todayItems : buildDayItems(selectedDate, routines, checks, selectedTodos);
  const messages = coach({ today, nowMinutes, routines, checks, todayTodos });

  return (
    <div className={styles.page}>
      <NowCard {...findNowAndNext(todayItems.timed, nowMinutes)} />
      <CoachPanel messages={messages} />
      <WeekBar selected={selectedDate} today={today} />

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {formatDateLabel(selectedDate)}
          {isToday && <span className={styles.todayTag}>오늘</span>}
        </h2>
        <Timeline
          items={selectedItems.timed}
          date={selectedDate}
          nowMinutes={isToday ? nowMinutes : null}
          canCheck={selectedDate <= today}
        />
      </section>

      {selectedItems.untimed.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>시간 없는 할 일</h2>
          <ul className={styles.list}>
            {selectedItems.untimed.map((item) => (
              <ItemRow key={item.key} item={item} date={selectedDate} canCheck={selectedDate <= today} />
            ))}
          </ul>
        </section>
      )}

      <AddTodoForm date={selectedDate} />
    </div>
  );
}
