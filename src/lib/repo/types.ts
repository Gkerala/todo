import type { CheckDetail, Routine, RoutineCheck, RoutineInput, Settings, Todo, TodoInput } from "@/lib/types";

/**
 * 저장소(Repository): 화면/서버 액션이 DB에 바라는 일을 모아 둔 "약속".
 * 길 A(SQLite)와 길 B(Supabase)가 각각 이 약속을 구현하므로,
 * 저장소를 바꿔도 화면 코드는 고치지 않아도 된다.
 *
 * 모든 메서드는 "로그인한 사람(owner)의 데이터만" 다룬다.
 * owner는 저장소를 만들 때 정해지고, 바깥에서 다른 사람 id를 넘길 방법이 없다.
 */
export interface Repo {
  getSettings(): Promise<Settings | null>;
  saveSettings(settings: Settings): Promise<void>;

  listRoutines(): Promise<Routine[]>;
  addRoutines(routines: RoutineInput[]): Promise<void>;
  updateRoutine(id: string, routine: RoutineInput): Promise<void>;
  deleteRoutine(id: string): Promise<void>;

  /** from~to(포함) 날짜의 체크 기록 */
  listChecks(from: string, to: string): Promise<RoutineCheck[]>;
  /** 체크하기. 이미 체크했으면 메모/운동 시간만 바꾼다. */
  checkRoutine(routineId: string, date: string, detail: CheckDetail): Promise<void>;
  uncheckRoutine(routineId: string, date: string): Promise<void>;

  listTodos(date: string): Promise<Todo[]>;
  addTodo(todo: TodoInput): Promise<void>;
  setTodoDone(id: string, done: boolean): Promise<void>;
  deleteTodo(id: string): Promise<void>;
}
