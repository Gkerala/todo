// 날짜/시간 계산 도우미.
// 서버(배포하면 다른 나라에 있을 수 있음)와 폰의 시계가 달라도 같은 "오늘"을 보도록 한국 시간으로 통일한다.

export const APP_TIME_ZONE = "Asia/Seoul";
export const WEEKDAY_LABELS = ["", "월", "화", "수", "목", "금", "토", "일"];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isTime(value: string): boolean {
  return TIME_RE.test(value);
}

export function isDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** 지금 한국 시간 기준 날짜("YYYY-MM-DD")와 자정부터 지난 분 */
export function nowInAppTz(at: Date = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** "07:30" → 450 */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** 450 → "07:30" (하루 범위 00:00~23:59로 자른다) */
export function fromMinutes(total: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(total)));
  const h = String(Math.floor(clamped / 60)).padStart(2, "0");
  const m = String(clamped % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 요일 숫자: 1=월 ... 7=일 */
export function weekdayOf(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

/** date가 속한 주의 월~일 7일 */
export function weekDates(date: string): string[] {
  const monday = addDays(date, 1 - weekdayOf(date));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** "2026-10-29" → "10월 29일 (목)" */
export function formatDateLabel(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${month}월 ${day}일 (${WEEKDAY_LABELS[weekdayOf(date)]})`;
}

/** 95 → "1시간 35분" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}
