import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseMode, supabaseEnv } from "@/lib/supabase/env";

/**
 * 모든 요청이 화면에 닿기 전에 거치는 문 (Next.js 16의 proxy, 예전 이름 middleware).
 * 길 B에서만 동작한다:
 *  1. 로그인 쿠키(JWT)가 만료되어 가면 Supabase에서 새로 받아 쿠키를 바꿔 준다.
 *  2. 로그인하지 않은 사람은 /login으로 보낸다.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseMode()) return NextResponse.next();

  const { url, key } = supabaseEnv();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname !== "/login") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }
  return response;
}

export const config = {
  // 이미지, 정적 파일은 검사하지 않는다
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
