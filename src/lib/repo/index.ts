import "server-only";
import type { Repo } from "./types";

/** 길 A는 로그인이 없으므로 모든 데이터의 주인을 이 값으로 둔다 */
const LOCAL_USER_ID = "local-user";

/**
 * 지금 요청에 쓸 저장소를 고른다. .env의 DB_PROVIDER로 바꾼다.
 *   sqlite   → 길 A: 내 컴퓨터의 todo.db
 *   supabase → 길 B: 클라우드 DB + 로그인 (예정)
 */
export async function getRepo(): Promise<Repo> {
  const provider = process.env.DB_PROVIDER ?? "sqlite";
  switch (provider) {
    case "sqlite": {
      const { createSqliteRepo } = await import("./sqlite");
      return createSqliteRepo(LOCAL_USER_ID);
    }
    default:
      throw new Error(`알 수 없는 DB_PROVIDER: ${provider}`);
  }
}
