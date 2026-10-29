// 길 A: 앱이 처음 DB에 연결할 때 실행하는 SQL. 표가 이미 있으면 건너뛴다(IF NOT EXISTS).
// CHECK / UNIQUE 같은 제약 조건으로 잘못된 데이터는 DB가 직접 거절한다. (DB.md "DB가 직접 지키는 규칙")
// 날짜/시간은 "YYYY-MM-DD", "HH:MM" 글자로 저장한다. 이 형식은 글자 비교 순서 = 시간 순서라서 비교가 그대로 된다.
export const INIT_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_settings (
  user_id    TEXT PRIMARY KEY,
  wake_time  TEXT NOT NULL,
  sleep_time TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS routines (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  title      TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  kind       TEXT NOT NULL CHECK (kind IN ('wake','meal','medicine','study','exercise','sleep','etc')),
  start_time TEXT NOT NULL,
  end_time   TEXT,
  days       TEXT NOT NULL CHECK (days <> '' AND days NOT GLOB '*[^1-7]*'),
  must_do    INTEGER NOT NULL DEFAULT 0 CHECK (must_do IN (0, 1)),
  created_at TEXT NOT NULL,
  CHECK (end_time IS NULL OR end_time > start_time)
);
CREATE INDEX IF NOT EXISTS routines_user_idx ON routines (user_id);

CREATE TABLE IF NOT EXISTS routine_checks (
  id         TEXT PRIMARY KEY,
  routine_id TEXT NOT NULL REFERENCES routines (id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  date       TEXT NOT NULL,
  memo       TEXT CHECK (memo IS NULL OR length(memo) <= 200),
  minutes    INTEGER CHECK (minutes IS NULL OR minutes BETWEEN 0 AND 1440),
  checked_at TEXT NOT NULL,
  UNIQUE (routine_id, date)
);
CREATE INDEX IF NOT EXISTS routine_checks_user_date_idx ON routine_checks (user_id, date);

CREATE TABLE IF NOT EXISTS todos (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  title      TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  date       TEXT NOT NULL,
  start_time TEXT,
  end_time   TEXT,
  done       INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
  created_at TEXT NOT NULL,
  CHECK (end_time IS NULL OR (start_time IS NOT NULL AND end_time > start_time))
);
CREATE INDEX IF NOT EXISTS todos_user_date_idx ON todos (user_id, date);
`;
