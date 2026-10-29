// RLS 확인 스크립트 (길 B, 과제 "다른 계정의 데이터는 조회·수정·삭제가 거절되는지")
// 앱 화면을 거치지 않고 Supabase에 직접 요청해서, DB의 RLS만으로 막히는지 확인한다.
//
// 준비: 앱에서 테스트 계정 2개를 가입하고, .env.local에 아래 4줄을 추가한다 (Git에 안 올라감)
//   RLS_TEST_A_EMAIL=...   RLS_TEST_A_PASSWORD=...
//   RLS_TEST_B_EMAIL=...   RLS_TEST_B_PASSWORD=...
// 실행: node --env-file=.env.local scripts/rls-test.mjs

import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;
const accounts = {
  A: [process.env.RLS_TEST_A_EMAIL, process.env.RLS_TEST_A_PASSWORD],
  B: [process.env.RLS_TEST_B_EMAIL, process.env.RLS_TEST_B_PASSWORD],
};
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || Object.values(accounts).flat().some((v) => !v)) {
  console.error(".env.local에 SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, RLS_TEST_A/B_EMAIL/PASSWORD가 필요해요.");
  process.exit(1);
}

const newClient = () =>
  createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function signIn(name) {
  const client = newClient();
  const [email, password] = accounts[name];
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${name} 로그인 실패: ${error.message}`);
  return { client, id: data.user.id };
}

const results = [];
function record(name, passed, detail) {
  results.push({ 확인: name, 결과: passed ? "✅ 통과" : "❌ 실패", 내용: detail });
}

const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
const a = await signIn("A");
const b = await signIn("B");
const anon = newClient();

// A가 테스트용 할 일과 루틴을 만든다
const { data: aTodo, error: e1 } = await a.client
  .from("todos")
  .insert({ title: "RLS 테스트 (A의 할 일)", date: today })
  .select()
  .single();
if (e1) throw new Error(`A의 할 일 만들기 실패: ${e1.message}`);
const { data: aRoutine, error: e2 } = await a.client
  .from("routines")
  .insert({ title: "RLS 테스트 (A의 루틴)", kind: "etc", start_time: "09:00", days: "1234567" })
  .select()
  .single();
if (e2) throw new Error(`A의 루틴 만들기 실패: ${e2.message}`);

try {
  // 1. B가 A의 할 일을 조회
  {
    const { data } = await b.client.from("todos").select("*").eq("id", aTodo.id);
    record("B가 A의 할 일 조회", data?.length === 0, `돌려받은 행 ${data?.length ?? 0}개`);
  }
  // 2. B가 A의 할 일 제목을 수정
  {
    const { data } = await b.client.from("todos").update({ title: "B가 바꿈" }).eq("id", aTodo.id).select();
    const { data: after } = await a.client.from("todos").select("title").eq("id", aTodo.id).single();
    record(
      "B가 A의 할 일 수정",
      data?.length === 0 && after?.title === aTodo.title,
      `수정된 행 ${data?.length ?? 0}개, A가 다시 본 제목: "${after?.title}"`,
    );
  }
  // 3. B가 A의 할 일을 삭제
  {
    const { data } = await b.client.from("todos").delete().eq("id", aTodo.id).select();
    const { data: still } = await a.client.from("todos").select("id").eq("id", aTodo.id);
    record("B가 A의 할 일 삭제", data?.length === 0 && still?.length === 1, `삭제된 행 ${data?.length ?? 0}개, A의 할 일 남아 있음: ${still?.length === 1}`);
  }
  // 4. B가 주인을 A로 속여서 할 일 만들기
  {
    const { error } = await b.client.from("todos").insert({ user_id: a.id, title: "가짜", date: today });
    record("B가 A 이름으로 할 일 만들기", error?.code === "42501", error ? `거절됨 (${error.code})` : "만들어짐!");
  }
  // 5. B가 A의 루틴에 체크 만들기
  {
    const { error } = await b.client.from("routine_checks").insert({ routine_id: aRoutine.id, date: today });
    record("B가 A의 루틴에 체크", error?.code === "42501", error ? `거절됨 (${error.code})` : "만들어짐!");
  }
  // 6. 로그인 안 한 사람이 할 일 조회
  {
    const { data, error } = await anon.from("todos").select("*");
    record("로그인 없이 조회", !!error || data?.length === 0, error ? `거절됨 (${error.code})` : `돌려받은 행 ${data?.length}개`);
  }
  // 7. A는 자기 할 일을 볼 수 있음 (정상 동작 확인)
  {
    const { data } = await a.client.from("todos").select("id").eq("id", aTodo.id);
    record("A가 자기 할 일 조회", data?.length === 1, `돌려받은 행 ${data?.length ?? 0}개`);
  }
} finally {
  // 테스트 데이터 정리
  await a.client.from("todos").delete().eq("id", aTodo.id);
  await a.client.from("routines").delete().eq("id", aRoutine.id);
}

console.log(`\nRLS 테스트 (${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })})`);
console.table(results);
const failed = results.filter((r) => r.결과.startsWith("❌")).length;
console.log(failed === 0 ? "\n모두 통과했어요. 다른 계정의 데이터는 DB(RLS)가 막아요." : `\n${failed}개 실패`);
process.exit(failed === 0 ? 0 : 1);
