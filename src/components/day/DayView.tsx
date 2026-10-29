"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { coach } from "@/lib/coach";
import { buildDayItems, findDue, findNowAndNext } from "@/lib/dayItems";
import { formatDateLabel, nowInAppTz } from "@/lib/time";
import type { Routine, RoutineCheck, Todo } from "@/lib/types";
import AddTodoForm from "./AddTodoForm";
import CoachPanel from "./CoachPanel";
import ItemRow from "./ItemRow";
import NowCard from "./NowCard";
import Timeline from "./Timeline";
import WeekBar from "./WeekBar";
import { useAlarm } from "./useAlarm";
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

const MINUTE_MS = 60_000;

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

  const alarm = useAlarm();
  const isToday = selectedDate === today;
  const todayItems = buildDayItems(today, routines, checks, todayTodos);
  const selectedItems = isToday ? todayItems : buildDayItems(selectedDate, routines, checks, selectedTodos);

  // 1분마다: 시작 시간이 된 일이 있으면 알람을 울리고, 시계를 갱신하고, 서버에서 데이터도 다시 받아온다.
  // useEffectEvent라서 타이머를 다시 걸지 않아도 항상 최신 nowMinutes/todayItems를 본다.
  const onMinute = useEffectEvent(() => {
    const minutes = nowInAppTz().minutes;
    const due = findDue(todayItems.timed, nowMinutes, minutes);
    if (due) alarm.ring(due);
    setNowMinutes(minutes);
    router.refresh();
  });

  // 알람이 "7:00:00"에 울리도록 다음 정각 분까지 기다렸다가, 그때부터 1분마다 돈다
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(
      () => {
        onMinute();
        interval = setInterval(onMinute, MINUTE_MS);
      },
      MINUTE_MS - (Date.now() % MINUTE_MS) + 50, // 50ms 여유: 경계 바로 전에 깨는 일 방지
    );
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const messages = coach({ today, nowMinutes, routines, checks, todayTodos });

  return (
    <div className={styles.page}>
      {alarm.ringing && (
        <div className={styles.alarmBanner} role="alert">
          <span>⏰ 지금 &lsquo;{alarm.ringing.title}&rsquo; 시간이에요!</span>
          <button type="button" className={styles.alarmDismiss} onClick={alarm.dismiss}>
            확인
          </button>
        </div>
      )}
      <NowCard {...findNowAndNext(todayItems.timed, nowMinutes)} />
      <div className={styles.soundRow}>
        <button type="button" className={styles.soundToggle} aria-pressed={alarm.soundOn} onClick={alarm.toggleSound}>
          {alarm.soundOn ? "🔔 소리 알림 켜짐" : "🔕 소리 알림 꺼짐"}
        </button>
        <span className={styles.soundHint}>앱이 열려 있을 때만 울려요</span>
      </div>
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
