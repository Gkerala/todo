import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/**
 * 요청한 사람의 로그인 쿠키(JWT)를 실어 보내는 Supabase 클라이언트.
 * 관리자 키가 아니라 "이 사용자로서" 접속하므로, DB의 RLS가 이 사람 기준으로 검사한다.
 */
export async function createSupabaseServerClient() {
  const { url, key } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 서버 컴포넌트(화면 그리기) 중에는 쿠키를 쓸 수 없다. 토큰 갱신은 src/proxy.ts가 맡는다.
        }
      },
    },
  });
}

/** 지금 로그인한 사용자. getUser()는 JWT를 Supabase Auth 서버에 다시 확인하므로 위조된 쿠키를 믿지 않는다. */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
