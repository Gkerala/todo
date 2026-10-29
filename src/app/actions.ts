"use server";
// 서버 액션 = 화면이 부르는 "백엔드 API". 이 함수들은 서버에서만 실행된다.
// 화면(브라우저)에서 온 값은 조작될 수 있으므로 여기서 모두 다시 검사한 뒤 저장소에 넘긴다.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { defaultRoutines } from "@/lib/defaultRoutines";
import { getRepo } from "@/lib/repo";
import { isDate, isTime, nowInAppTz } from "@/lib/time";
import { KINDS, type CheckDetail, type FormState, type Kind, type RoutineInput } from "@/lib/types";

/** 사용자에게 그대로 보여 줄 입력 오류 */
class InputError extends Error {}

function fail(message: string): never {
  throw new InputError(message);
}

function field(fd: FormData, name: string): string {
  const value = fd.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parseTitle(fd: FormData): string {
  const title = field(fd, "title");
  if (!title) fail("제목을 입력해 주세요.");
  if (title.length > 100) fail("제목은 100자까지 쓸 수 있어요.");
  return title;
}

function parseTimeRange(fd: FormData, startRequired: boolean) {
  const start = field(fd, "start") || null;
  const end = field(fd, "end") || null;
  if (startRequired && !start) fail("시작 시간을 입력해 주세요.");
  if ((start && !isTime(start)) || (end && !isTime(end))) fail("시간은 HH:MM 형식이어야 해요.");
  if (end && !start) fail("끝 시간만 있을 수는 없어요. 시작 시간도 넣어 주세요.");
  if (start && end && end <= start) fail("끝 시간은 시작 시간보다 늦어야 해요.");
  return { start, end };
}

function parseRoutine(fd: FormData): RoutineInput {
  const title = parseTitle(fd);
  const kind = field(fd, "kind");
  if (!KINDS.includes(kind as Kind)) fail("종류를 골라 주세요.");
  const { start, end } = parseTimeRange(fd, true);
  const days = [...new Set(fd.getAll("days").map(String))]
    .filter((d) => /^[1-7]$/.test(d))
    .sort()
    .join("");
  if (!days) fail("요일을 하나 이상 골라 주세요.");
  return { title, kind: kind as Kind, startTime: start!, endTime: end, days, mustDo: fd.get("mustDo") === "on" };
}

function parseCheckDetail(fd: FormData): CheckDetail {
  const memo = field(fd, "memo") || null;
  if (memo && memo.length > 200) fail("메모는 200자까지 쓸 수 있어요.");
  const minutesText = field(fd, "minutes");
  const minutes = minutesText === "" ? null : Number(minutesText);
  if (minutes !== null && (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440)) {
    fail("운동 시간은 0~1440분 사이의 정수로 적어 주세요.");
  }
  return { memo, minutes };
}

/** 화면에서 넘어온 id가 정상적인 글자인지 확인 (주인 확인은 저장소가 한다) */
function assertId(id: unknown): asserts id is string {
  if (typeof id !== "string" || id.length === 0 || id.length > 100) fail("잘못된 요청이에요.");
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/routines");
}

/** 폼 액션 공통 처리: 입력 오류는 화면에 보여 주고, 그 밖의 오류는 오류 화면으로 보낸다 */
async function handleForm(run: () => Promise<void>): Promise<FormState> {
  try {
    await run();
  } catch (e) {
    if (e instanceof InputError) return { error: e.message };
    throw e;
  }
  refresh();
  return undefined;
}

// ── 시작 화면: 기상/취침 시간 → 기본 루틴 만들기 ──
export async function setupAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const result = await handleForm(async () => {
    const wakeTime = field(fd, "wake");
    const sleepTime = field(fd, "sleep");
    if (!isTime(wakeTime) || !isTime(sleepTime)) fail("시간을 HH:MM 형식으로 입력해 주세요.");
    if (wakeTime === sleepTime) fail("기상 시간과 취침 시간이 같을 수 없어요.");

    const repo = await getRepo();
    await repo.saveSettings({ wakeTime, sleepTime });
    if ((await repo.listRoutines()).length === 0) {
      await repo.addRoutines(defaultRoutines(wakeTime, sleepTime));
    }
  });
  if (result?.error) return result;
  redirect("/");
}

// ── 루틴 ──
export async function addRoutineAction(_prev: FormState, fd: FormData): Promise<FormState> {
  return handleForm(async () => {
    const routine = parseRoutine(fd);
    await (await getRepo()).addRoutines([routine]);
  });
}

export async function updateRoutineAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  return handleForm(async () => {
    assertId(id);
    const routine = parseRoutine(fd);
    await (await getRepo()).updateRoutine(id, routine);
  });
}

export async function deleteRoutineAction(id: string) {
  assertId(id);
  await (await getRepo()).deleteRoutine(id);
  refresh();
}

export async function checkRoutineAction(routineId: string, date: string, fd: FormData) {
  assertId(routineId);
  if (!isDate(date)) fail("날짜가 올바르지 않아요.");
  if (date > nowInAppTz().date) fail("미래의 루틴은 미리 체크할 수 없어요.");
  await (await getRepo()).checkRoutine(routineId, date, parseCheckDetail(fd));
  refresh();
}

export async function uncheckRoutineAction(routineId: string, date: string) {
  assertId(routineId);
  if (!isDate(date)) fail("날짜가 올바르지 않아요.");
  await (await getRepo()).uncheckRoutine(routineId, date);
  refresh();
}

// ── 할 일 ──
export async function addTodoAction(_prev: FormState, fd: FormData): Promise<FormState> {
  return handleForm(async () => {
    const title = parseTitle(fd);
    const date = field(fd, "date");
    if (!isDate(date)) fail("날짜가 올바르지 않아요.");
    const { start, end } = parseTimeRange(fd, false);
    await (await getRepo()).addTodo({ title, date, startTime: start, endTime: end });
  });
}

export async function toggleTodoAction(id: string, done: boolean) {
  assertId(id);
  await (await getRepo()).setTodoDone(id, done === true);
  refresh();
}

export async function deleteTodoAction(id: string) {
  assertId(id);
  await (await getRepo()).deleteTodo(id);
  refresh();
}
