import "server-only"; // 이 파일이 실수로 브라우저 코드에 들어가면 빌드가 실패한다.
import { and, asc, between, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { routineChecks, routines, todos, userSettings } from "@/db/schema";
import { INIT_SQL } from "@/db/sqlite-init";
import type { Routine, RoutineCheck, Todo } from "@/lib/types";
import type { Repo } from "./types";

function connect() {
  return drizzle({
    connection: { url: process.env.SQLITE_URL ?? "file:todo.db" },
    // 개발할 때만 실행되는 SQL을 터미널에 출력한다 (학습용). 배포 로그에 사용자 기록이 남지 않게 한다.
    logger: process.env.NODE_ENV === "development",
  });
}
type Db = ReturnType<typeof connect>;

// 개발 중에는 코드를 고칠 때마다 모듈이 다시 읽힌다. 연결이 계속 새로 생기지 않도록 하나만 만들어 재사용한다.
const cache = globalThis as unknown as { sqliteDb?: Promise<Db> };

function getDb(): Promise<Db> {
  cache.sqliteDb ??= (async () => {
    const db = connect();
    await db.$client.executeMultiple(INIT_SQL);
    return db;
  })();
  return cache.sqliteDb;
}

/**
 * 길 A 저장소 (로컬 SQLite 파일 todo.db).
 * 모든 쿼리에 `user_id = owner` 조건을 붙여 "내 것만" 다룬다.
 * Drizzle은 값을 SQL 문장에 끼워 넣지 않고 따로 전달(파라미터화)하므로 SQL 주입이 막힌다.
 */
export async function createSqliteRepo(owner: string): Promise<Repo> {
  const db = await getDb();
  const now = () => new Date().toISOString();

  return {
    async getSettings() {
      const row = await db.select().from(userSettings).where(eq(userSettings.userId, owner)).get();
      return row ? { wakeTime: row.wakeTime, sleepTime: row.sleepTime } : null;
    },

    async saveSettings(settings) {
      await db
        .insert(userSettings)
        .values({ userId: owner, ...settings })
        .onConflictDoUpdate({ target: userSettings.userId, set: settings });
    },

    async listRoutines() {
      const rows = await db
        .select()
        .from(routines)
        .where(eq(routines.userId, owner))
        .orderBy(asc(routines.startTime), asc(routines.createdAt));
      return rows.map(
        (r): Routine => ({
          id: r.id,
          title: r.title,
          kind: r.kind,
          startTime: r.startTime,
          endTime: r.endTime,
          days: r.days,
          mustDo: r.mustDo,
        }),
      );
    },

    async addRoutines(inputs) {
      if (inputs.length === 0) return;
      await db
        .insert(routines)
        .values(inputs.map((r) => ({ ...r, id: crypto.randomUUID(), userId: owner, createdAt: now() })));
    },

    async updateRoutine(id, routine) {
      await db
        .update(routines)
        .set(routine)
        .where(and(eq(routines.id, id), eq(routines.userId, owner)));
    },

    async deleteRoutine(id) {
      // 체크 기록도 함께 지운다 (DB의 ON DELETE CASCADE와 같은 일을 코드에서도 확실히 한다)
      await db.delete(routineChecks).where(and(eq(routineChecks.routineId, id), eq(routineChecks.userId, owner)));
      await db.delete(routines).where(and(eq(routines.id, id), eq(routines.userId, owner)));
    },

    async listChecks(from, to) {
      const rows = await db
        .select()
        .from(routineChecks)
        .where(and(eq(routineChecks.userId, owner), between(routineChecks.date, from, to)));
      return rows.map(
        (c): RoutineCheck => ({ routineId: c.routineId, date: c.date, memo: c.memo, minutes: c.minutes }),
      );
    },

    async checkRoutine(routineId, date, { memo, minutes }) {
      // 남의 루틴 id를 보내 체크 기록을 만드는 것을 막기 위해, 내 루틴인지 먼저 확인한다.
      const mine = await db
        .select({ id: routines.id })
        .from(routines)
        .where(and(eq(routines.id, routineId), eq(routines.userId, owner)))
        .get();
      if (!mine) throw new Error("루틴을 찾을 수 없어요.");

      await db
        .insert(routineChecks)
        .values({ id: crypto.randomUUID(), routineId, userId: owner, date, memo, minutes, checkedAt: now() })
        .onConflictDoUpdate({
          target: [routineChecks.routineId, routineChecks.date],
          set: { memo, minutes, checkedAt: now() },
        });
    },

    async uncheckRoutine(routineId, date) {
      await db
        .delete(routineChecks)
        .where(
          and(eq(routineChecks.routineId, routineId), eq(routineChecks.date, date), eq(routineChecks.userId, owner)),
        );
    },

    async listTodos(date) {
      const rows = await db
        .select()
        .from(todos)
        .where(and(eq(todos.userId, owner), eq(todos.date, date)))
        .orderBy(asc(todos.startTime), asc(todos.createdAt));
      return rows.map(
        (t): Todo => ({
          id: t.id,
          title: t.title,
          date: t.date,
          startTime: t.startTime,
          endTime: t.endTime,
          done: t.done,
        }),
      );
    },

    async addTodo(todo) {
      await db.insert(todos).values({ ...todo, id: crypto.randomUUID(), userId: owner, done: false, createdAt: now() });
    },

    async setTodoDone(id, done) {
      await db
        .update(todos)
        .set({ done })
        .where(and(eq(todos.id, id), eq(todos.userId, owner)));
    },

    async deleteTodo(id) {
      await db.delete(todos).where(and(eq(todos.id, id), eq(todos.userId, owner)));
    },
  };
}
