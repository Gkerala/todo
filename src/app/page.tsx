import { Suspense } from "react";
import { connection } from "next/server";
import DayView from "@/components/day/DayView";
import Loading from "@/components/Loading";
import Onboarding from "@/components/Onboarding";
import { getRepo } from "@/lib/repo";
import { addDays, isDate, nowInAppTz, weekDates } from "@/lib/time";

/** 연속 성공 계산을 위해 가져올 과거 기록 기간 */
const HISTORY_DAYS = 60;

type SearchParams = Promise<{ date?: string | string[] }>;

export default function HomePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<Loading />}>
      <Today searchParams={searchParams} />
    </Suspense>
  );
}

// 서버 컴포넌트: 서버에서 DB를 읽고, 화면(클라이언트 컴포넌트)에는 데이터만 넘긴다.
async function Today({ searchParams }: { searchParams: SearchParams }) {
  await connection(); // 사람마다, 시각마다 달라지는 화면이라 미리 만들어 두지 않고 요청 때마다 만든다
  const repo = await getRepo();
  const settings = await repo.getSettings();
  if (!settings) return <Onboarding />;

  const now = nowInAppTz();
  const { date } = await searchParams;
  const selectedDate = typeof date === "string" && isDate(date) ? date : now.date;

  // 선택한 주(날짜 버튼)와 최근 기록을 모두 덮는 기간의 체크를 한 번에 가져온다.
  const week = weekDates(selectedDate);
  const historyStart = addDays(now.date, -HISTORY_DAYS);
  const from = historyStart < week[0] ? historyStart : week[0];
  const to = now.date > week[6] ? now.date : week[6];

  const [routines, checks, todayTodos, selectedTodos] = await Promise.all([
    repo.listRoutines(),
    repo.listChecks(from, to),
    repo.listTodos(now.date),
    selectedDate === now.date ? null : repo.listTodos(selectedDate),
  ]);

  return (
    <DayView
      today={now.date}
      selectedDate={selectedDate}
      initialNowMinutes={now.minutes}
      routines={routines}
      checks={checks}
      todayTodos={todayTodos}
      selectedTodos={selectedTodos ?? todayTodos}
    />
  );
}
