import "server-only";
import { redirect } from "next/navigation";
import type { Repo } from "./types";

/** 길 A는 로그인이 없으므로 모든 데이터의 주인을 이 값으로 둔다 */
const LOCAL_USER_ID = "local-user";

/**
 * 지금 요청에 쓸 저장소를 고른다. .env.local의 DB_PROVIDER로 바꾼다.
 *   sqlite   → 길 A: 내 컴퓨터의 todo.db (로그인 없음)
 *   supabase → 길 B: 클라우드 DB. 로그인한 사용자로 접속하고, 로그인 안 했으면 /login으로 보낸다
 */
export async function getRepo(): Promise<Repo> {
  const provider = process.env.DB_PROVIDER ?? "sqlite";
  switch (provider) {
    case "sqlite": {
      const { createSqliteRepo } = await import("./sqlite");
      return createSqliteRepo(LOCAL_USER_ID);
    }
    case "supabase": {
      const { getCurrentUser } = await import("@/lib/supabase/server");
      const { supabase, user } = await getCurrentUser();
      if (!user) redirect("/login");
      const { createSupabaseRepo } = await import("./supabase");
      return createSupabaseRepo(supabase, user.id);
    }
    default:
      throw new Error(`알 수 없는 DB_PROVIDER: ${provider}`);
  }
}
