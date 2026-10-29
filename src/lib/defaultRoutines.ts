import { fromMinutes, toMinutes } from "./time";
import type { Kind, RoutineInput } from "./types";

const EVERY_DAY = "1234567";

/**
 * 기상/취침 시간만으로 하루 기본 루틴을 만든다. (PRD 주요 기능 1)
 * 코치가 첫날 계획을 같이 짜 주는 역할이고, 사용자는 루틴 관리 화면에서 고치거나 지운다.
 */
export function defaultRoutines(wakeTime: string, sleepTime: string): RoutineInput[] {
  const wake = toMinutes(wakeTime);
  // 자정을 넘겨 자는 경우(예: 01:00) 하루 안의 루틴은 23:59까지만 배치한다.
  const dayEnd = toMinutes(sleepTime) > wake ? toMinutes(sleepTime) : 23 * 60 + 59;

  const plan: { kind: Kind; title: string; start: number; end: number; mustDo: boolean }[] = [
    { kind: "wake", title: "기상", start: wake, end: wake + 10, mustDo: true },
    { kind: "meal", title: "아침 식사", start: wake + 30, end: wake + 60, mustDo: false },
    { kind: "medicine", title: "아침 약", start: wake + 60, end: wake + 65, mustDo: true },
    { kind: "study", title: "공부", start: wake + 120, end: wake + 240, mustDo: false },
    { kind: "meal", title: "점심 식사", start: 12 * 60 + 30, end: 13 * 60 + 20, mustDo: false },
    { kind: "exercise", title: "운동", start: 18 * 60, end: 18 * 60 + 40, mustDo: false },
    { kind: "meal", title: "저녁 식사", start: 19 * 60, end: 19 * 60 + 40, mustDo: false },
  ];

  const routines: RoutineInput[] = plan
    .filter((p) => p.start >= wake && p.end <= dayEnd)
    .map((p) => ({
      kind: p.kind,
      title: p.title,
      startTime: fromMinutes(p.start),
      endTime: fromMinutes(p.end),
      days: EVERY_DAY,
      mustDo: p.mustDo,
    }));

  routines.push({ kind: "sleep", title: "취침", startTime: sleepTime, endTime: null, days: EVERY_DAY, mustDo: true });
  return routines;
}
