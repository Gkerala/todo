import "server-only";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { Kind, Routine, RoutineCheck, RoutineInput, Todo } from "@/lib/types";
import type { Repo } from "./types";

type RoutineRow = {
  id: string;
  title: string;
  kind: Kind;
  start_time: string;
  end_time: string | null;
  days: string;
  must_do: boolean;
};
type CheckRow = { routine_id: string; date: string; memo: string | null; minutes: number | null };
type TodoRow = {
  id: string;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  done: boolean;
};

/** PostgreSQL time은 "07:30:00"으로 오므로 앱 형식 "07:30"으로 맞춘다 */
function hhmm(time: string): string;
function hhmm(time: string | null): string | null;
function hhmm(time: string | null) {
  return time === null ? null : time.slice(0, 5);
}

function fail(error: PostgrestError): never {
  // 42501 = RLS 정책 위반 (남의 루틴에 체크하려는 등)
  if (error.code === "42501") throw new Error("권한이 없는 데이터예요.");
  throw new Error(`DB 오류: ${error.message}`);
}

function routineRow(r: RoutineInput) {
  return {
    title: r.title,
    kind: r.kind,
    start_time: r.startTime,
    end_time: r.endTime,
    days: r.days,
    must_do: r.mustDo,
  };
}

/**
 * 길 B 저장소 (Supabase PostgreSQL).
 * 로그인한 사용자의 JWT로 접속하므로 DB의 RLS가 "자기 행만" 허용한다.
 * 코드에서도 user_id 조건을 한 번 더 붙인다 (이중 방어).
 */
export function createSupabaseRepo(db: SupabaseClient, owner: string): Repo {
  return {
    async getSettings() {
      const { data, error } = await db
        .from("user_settings")
        .select("wake_time, sleep_time")
        .eq("user_id", owner)
        .maybeSingle<{ wake_time: string; sleep_time: string }>();
      if (error) fail(error);
      return data ? { wakeTime: hhmm(data.wake_time), sleepTime: hhmm(data.sleep_time) } : null;
    },

    async saveSettings(s) {
      const { error } = await db
        .from("user_settings")
        .upsert({ user_id: owner, wake_time: s.wakeTime, sleep_time: s.sleepTime });
      if (error) fail(error);
    },

    async listRoutines() {
      const { data, error } = await db
        .from("routines")
        .select("id, title, kind, start_time, end_time, days, must_do")
        .eq("user_id", owner)
        .order("start_time")
        .order("created_at")
        .overrideTypes<RoutineRow[], { merge: false }>();
      if (error) fail(error);
      return data.map(
        (r): Routine => ({
          id: r.id,
          title: r.title,
          kind: r.kind,
          startTime: hhmm(r.start_time),
          endTime: hhmm(r.end_time),
          days: r.days,
          mustDo: r.must_do,
        }),
      );
    },

    async addRoutines(inputs) {
      if (inputs.length === 0) return;
      const { error } = await db.from("routines").insert(inputs.map((r) => ({ ...routineRow(r), user_id: owner })));
      if (error) fail(error);
    },

    async updateRoutine(id, routine) {
      const { error } = await db.from("routines").update(routineRow(routine)).eq("id", id).eq("user_id", owner);
      if (error) fail(error);
    },

    async deleteRoutine(id) {
      // 체크 기록은 DB의 on delete cascade로 함께 지워진다
      const { error } = await db.from("routines").delete().eq("id", id).eq("user_id", owner);
      if (error) fail(error);
    },

    async listChecks(from, to) {
      const { data, error } = await db
        .from("routine_checks")
        .select("routine_id, date, memo, minutes")
        .eq("user_id", owner)
        .gte("date", from)
        .lte("date", to)
        .overrideTypes<CheckRow[], { merge: false }>();
      if (error) fail(error);
      return data.map(
        (c): RoutineCheck => ({ routineId: c.routine_id, date: c.date, memo: c.memo, minutes: c.minutes }),
      );
    },

    async checkRoutine(routineId, date, { memo, minutes }) {
      // 남의 루틴 id면 RLS의 with check(내 루틴인지 확인)에서 거절된다
      const { error } = await db
        .from("routine_checks")
        .upsert(
          { routine_id: routineId, user_id: owner, date, memo, minutes, checked_at: new Date().toISOString() },
          { onConflict: "routine_id,date" },
        );
      if (error) fail(error);
    },

    async uncheckRoutine(routineId, date) {
      const { error } = await db
        .from("routine_checks")
        .delete()
        .eq("routine_id", routineId)
        .eq("date", date)
        .eq("user_id", owner);
      if (error) fail(error);
    },

    async listTodos(date) {
      const { data, error } = await db
        .from("todos")
        .select("id, title, date, start_time, end_time, done")
        .eq("user_id", owner)
        .eq("date", date)
        .order("start_time", { nullsFirst: true })
        .order("created_at")
        .overrideTypes<TodoRow[], { merge: false }>();
      if (error) fail(error);
      return data.map(
        (t): Todo => ({
          id: t.id,
          title: t.title,
          date: t.date,
          startTime: hhmm(t.start_time),
          endTime: hhmm(t.end_time),
          done: t.done,
        }),
      );
    },

    async addTodo(todo) {
      const { error } = await db.from("todos").insert({
        user_id: owner,
        title: todo.title,
        date: todo.date,
        start_time: todo.startTime,
        end_time: todo.endTime,
      });
      if (error) fail(error);
    },

    async setTodoDone(id, done) {
      const { error } = await db.from("todos").update({ done }).eq("id", id).eq("user_id", owner);
      if (error) fail(error);
    },

    async deleteTodo(id) {
      const { error } = await db.from("todos").delete().eq("id", id).eq("user_id", owner);
      if (error) fail(error);
    },
  };
}
