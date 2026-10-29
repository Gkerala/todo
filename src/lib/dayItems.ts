import { isScheduled } from "./coach";
import { toMinutes } from "./time";
import { KIND_INFO, type Kind, type Routine, type RoutineCheck, type Todo } from "./types";

/** 시간표 한 줄. 루틴과 할 일을 같은 모양으로 맞춰서 시간순으로 섞어 보여 준다. */
export type DayItem = {
  key: string;
  type: "routine" | "todo";
  id: string;
  title: string;
  kind: Kind | null;
  start: string | null;
  end: string | null;
  mustDo: boolean;
  done: boolean;
  check: RoutineCheck | null;
};

export function buildDayItems(date: string, routines: Routine[], checks: RoutineCheck[], todos: Todo[]) {
  const checkByRoutine = new Map(checks.filter((c) => c.date === date).map((c) => [c.routineId, c]));

  const items: DayItem[] = [
    ...routines
      .filter((r) => isScheduled(r, date))
      .map((r): DayItem => {
        const check = checkByRoutine.get(r.id) ?? null;
        return {
          key: `routine-${r.id}`,
          type: "routine",
          id: r.id,
          title: r.title,
          kind: r.kind,
          start: r.startTime,
          end: r.endTime,
          mustDo: r.mustDo,
          done: check !== null,
          check,
        };
      }),
    ...todos.map(
      (t): DayItem => ({
        key: `todo-${t.id}`,
        type: "todo",
        id: t.id,
        title: t.title,
        kind: null,
        start: t.startTime,
        end: t.endTime,
        mustDo: false,
        done: t.done,
        check: null,
      }),
    ),
  ];

  return {
    timed: items.filter((i) => i.start !== null).sort((a, b) => a.start!.localeCompare(b.start!)),
    untimed: items.filter((i) => i.start === null),
  };
}

/** 끝 시간이 없는 일정은 이만큼(또는 다음 일정 시작까지) 진행된다고 본다 */
const DEFAULT_DURATION_MINUTES = 30;

export type NowAndNext = {
  current: { item: DayItem; remaining: number; progress: number } | null;
  next: { item: DayItem; inMinutes: number } | null;
};

/** "지금 할 일" 카드용: 지금 시간에 걸쳐 있는 아직 안 한 일, 그리고 다음 일 */
export function findNowAndNext(timed: DayItem[], nowMinutes: number): NowAndNext {
  const windows = timed.map((item, i) => {
    const start = toMinutes(item.start!);
    const nextStart = timed
      .slice(i + 1)
      .map((n) => toMinutes(n.start!))
      .find((s) => s > start);
    const end = item.end ? toMinutes(item.end) : Math.min(start + DEFAULT_DURATION_MINUTES, nextStart ?? Infinity);
    return { item, start, end };
  });

  const open = windows.filter((w) => !w.item.done);
  const current = open.filter((w) => w.start <= nowMinutes && nowMinutes < w.end).at(-1);
  const next = open.find((w) => w.start > nowMinutes);

  return {
    current: current
      ? {
          item: current.item,
          remaining: current.end - nowMinutes,
          progress: (nowMinutes - current.start) / (current.end - current.start),
        }
      : null,
    next: next ? { item: next.item, inMinutes: next.start - nowMinutes } : null,
  };
}

export function emojiOf(item: DayItem): string {
  return item.kind ? KIND_INFO[item.kind].emoji : "📝";
}
