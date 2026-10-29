// 앱 전체에서 쓰는 데이터 모양. DB 종류(SQLite / Supabase)와 상관없이 같다.

export const KINDS = ["wake", "meal", "medicine", "study", "exercise", "sleep", "etc"] as const;
export type Kind = (typeof KINDS)[number];

export const KIND_INFO: Record<Kind, { label: string; emoji: string }> = {
  wake: { label: "기상", emoji: "⏰" },
  meal: { label: "식사", emoji: "🍚" },
  medicine: { label: "약", emoji: "💊" },
  study: { label: "공부", emoji: "📚" },
  exercise: { label: "운동", emoji: "🏃" },
  sleep: { label: "취침", emoji: "🌙" },
  etc: { label: "기타", emoji: "📌" },
};

export type Settings = {
  wakeTime: string; // "HH:MM"
  sleepTime: string;
};

/** 루틴 = 반복되는 "규칙". 했는지 여부는 RoutineCheck에 날짜별로 따로 쌓인다. */
export type Routine = {
  id: string;
  title: string;
  kind: Kind;
  startTime: string;
  endTime: string | null;
  /** 요일 숫자 모음. 1=월 ... 7=일 (예: "135" = 월·수·금) */
  days: string;
  mustDo: boolean;
};
export type RoutineInput = Omit<Routine, "id">;

/** 어떤 루틴을 어느 날 했는지. 식사 메모, 운동 시간(분)도 여기에 남긴다. */
export type RoutineCheck = {
  routineId: string;
  date: string; // "YYYY-MM-DD"
  memo: string | null;
  minutes: number | null;
};
export type CheckDetail = Pick<RoutineCheck, "memo" | "minutes">;

/** 그날 한 번만 있는 할 일 */
export type Todo = {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  done: boolean;
};
export type TodoInput = Omit<Todo, "id" | "done">;

/** 폼 제출 결과. 입력이 잘못되면 error에 이유를 담아 화면에 보여 준다. */
export type FormState = { error?: string } | undefined;
