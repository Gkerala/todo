import { addDays, formatDuration, toMinutes, weekDates, weekdayOf } from "./time";
import type { Routine, RoutineCheck, Todo } from "./types";

export type CoachLevel = "alert" | "warn" | "praise" | "info";
export type CoachMessage = { level: CoachLevel; text: string };

export type CoachInput = {
  today: string;
  nowMinutes: number;
  routines: Routine[];
  /** 최근 체크 기록 (오늘 포함). 연속 성공, 이번 주 운동 시간 계산에 쓴다. */
  checks: RoutineCheck[];
  todayTodos: Todo[];
};

/** 시작 시간이 이만큼 지나도 체크가 없으면 코치가 말을 건다 */
const GRACE_MINUTES = { mustDo: 5, normal: 15 };
/** 끼니를 "거른 것 같다"고 말하는 기준 */
const MISSED_MEAL_MINUTES = 60;
const STREAK_TO_PRAISE = 3;
const STREAK_LOOKBACK_DAYS = 60;
const LEVEL_ORDER: Record<CoachLevel, number> = { alert: 0, warn: 1, praise: 2, info: 3 };

/**
 * 규칙 기반 1:1 코치 (PRD 주요 기능 3).
 * 입력(내 루틴과 기록)만 보고 메시지를 만드는 순수 함수라서,
 * 나중에 같은 입력/출력 모양을 유지한 채 AI 코치로 바꿔 끼울 수 있다.
 */
export function coach({ today, nowMinutes, routines, checks, todayTodos }: CoachInput): CoachMessage[] {
  const checked = new Set(checks.map((c) => `${c.routineId}|${c.date}`));
  const isChecked = (routineId: string, date: string) => checked.has(`${routineId}|${date}`);
  const todays = routines.filter((r) => isScheduled(r, today));
  const messages: CoachMessage[] = [];

  // 1) 시간이 지났는데 아직 안 한 루틴
  for (const r of todays) {
    if (isChecked(r.id, today)) continue;
    const late = nowMinutes - toMinutes(r.startTime);
    if (late >= (r.mustDo ? GRACE_MINUTES.mustDo : GRACE_MINUTES.normal)) {
      messages.push({ level: r.mustDo ? "alert" : "warn", text: overdueText(r, late) });
    }
  }

  // 2) 오늘 달성률
  const total = todays.length + todayTodos.length;
  const done = todays.filter((r) => isChecked(r.id, today)).length + todayTodos.filter((t) => t.done).length;
  if (total > 0) {
    messages.push(
      done === total
        ? { level: "praise", text: `🎉 오늘 할 일을 모두 해냈어요! (${done}/${total})` }
        : { level: "info", text: `오늘 ${done}/${total} 완료 (${Math.round((done / total) * 100)}%)` },
    );
  }

  // 3) 연속 성공 칭찬
  for (const r of todays) {
    const streak = streakOf(r, today, isChecked);
    if (streak >= STREAK_TO_PRAISE) messages.push({ level: "praise", text: `🔥 '${r.title}' ${streak}일 연속 성공!` });
  }

  // 4) 이번 주 운동 시간 (다이어트 기록)
  const thisWeek = new Set(weekDates(today).filter((d) => d <= today));
  const exerciseIds = new Set(routines.filter((r) => r.kind === "exercise").map((r) => r.id));
  const exerciseMinutes = checks
    .filter((c) => thisWeek.has(c.date) && exerciseIds.has(c.routineId))
    .reduce((sum, c) => sum + (c.minutes ?? 0), 0);
  if (exerciseMinutes > 0) {
    messages.push({ level: "info", text: `🏃 이번 주 운동 총 ${formatDuration(exerciseMinutes)}` });
  }

  return messages.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
}

/** 이 루틴이 그 날짜의 요일에 하는 루틴인가 */
export function isScheduled(routine: Routine, date: string): boolean {
  return routine.days.includes(String(weekdayOf(date)));
}

/** 요일에 해당하는 날만 세어, 끊기지 않고 체크한 날 수 */
function streakOf(r: Routine, today: string, isChecked: (id: string, date: string) => boolean): number {
  // 오늘 아직 안 했다면 어제부터 센다. 오늘은 아직 기회가 남아 있어서 끊긴 게 아니다.
  let date = isChecked(r.id, today) ? today : addDays(today, -1);
  let count = 0;
  for (let i = 0; i < STREAK_LOOKBACK_DAYS; i++, date = addDays(date, -1)) {
    if (!isScheduled(r, date)) continue;
    if (!isChecked(r.id, date)) break;
    count++;
  }
  return count;
}

function overdueText(r: Routine, late: number): string {
  const ago = formatDuration(late);
  switch (r.kind) {
    case "wake":
      return `⏰ 기상 시간이 ${ago} 지났어요. 일어났다면 체크해 주세요!`;
    case "meal":
      return late >= MISSED_MEAL_MINUTES
        ? `🍚 '${r.title}'를 거르셨나요? 식사는 꼭 챙겨요.`
        : `🍚 '${r.title}' 시간이에요. 먹은 음식도 적어 주세요.`;
    case "medicine":
      return `💊 '${r.title}' 시간이 ${ago} 지났어요! 지금 바로 챙겨요.`;
    case "study":
      return `📚 '${r.title}' 시작이 ${ago} 늦었어요. 딱 5분만 먼저 해 볼까요?`;
    case "exercise":
      return `🏃 '${r.title}' 시간이에요. 짧게라도 움직여 봐요!`;
    case "sleep":
      return `🌙 잘 시간이 ${ago} 지났어요. 화면을 끄고 쉬어요.`;
    default:
      return `📌 '${r.title}' 시간이 ${ago} 지났어요.`;
  }
}
