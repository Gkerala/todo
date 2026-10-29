/** 길 B 설정값. 서버에서만 읽는다 (NEXT_PUBLIC_ 이름이 아니라서 브라우저로 전달되지 않는다). */
export function supabaseEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY가 .env.local에 없어요. (.env.example 참고)");
  }
  return { url, key };
}

export function isSupabaseMode() {
  return process.env.DB_PROVIDER === "supabase";
}
