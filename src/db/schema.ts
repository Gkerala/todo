// 길 A(SQLite) 표 정의. Drizzle이 이 정의를 보고 TypeScript 타입과 SQL을 만든다.
// 표를 실제로 만드는 SQL(제약 조건 포함)은 sqlite-init.ts에 있다. 설계 설명은 DB.md 참고.
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { KINDS } from "@/lib/types";

export const userSettings = sqliteTable("user_settings", {
  userId: text("user_id").primaryKey(),
  wakeTime: text("wake_time").notNull(),
  sleepTime: text("sleep_time").notNull(),
});

export const routines = sqliteTable("routines", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  kind: text("kind", { enum: KINDS }).notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),
  days: text("days").notNull(),
  mustDo: integer("must_do", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull(),
});

export const routineChecks = sqliteTable("routine_checks", {
  id: text("id").primaryKey(),
  routineId: text("routine_id")
    .notNull()
    .references(() => routines.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  memo: text("memo"),
  minutes: integer("minutes"),
  checkedAt: text("checked_at").notNull(),
});

export const todos = sqliteTable("todos", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  done: integer("done", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull(),
});
