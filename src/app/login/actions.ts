"use server";
// 로그인/회원가입/로그아웃. 비밀번호는 우리 DB에 저장하지 않고 Supabase Auth가 안전하게(해시) 보관한다.

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "이메일 또는 비밀번호가 맞지 않아요.";
    case "user_already_exists":
    case "email_exists":
      return "이미 가입된 이메일이에요. 로그인해 주세요.";
    case "weak_password":
      return "비밀번호가 너무 쉬워요. 더 길고 복잡하게 만들어 주세요.";
    case "over_email_send_rate_limit":
      return "확인 메일 발송 한도를 넘었어요. Supabase에서 Confirm email을 끄거나 잠시 뒤에 다시 해 주세요.";
    case "email_not_confirmed":
      return "가입 확인 메일의 링크를 먼저 눌러 주세요.";
    default:
      return `로그인 중 문제가 생겼어요: ${error.message}`;
  }
}

export async function authAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const intent = fd.get("intent") === "signup" ? "signup" : "signin";

  if (!EMAIL_RE.test(email)) return { error: "이메일 형식이 올바르지 않아요." };
  if (password.length < MIN_PASSWORD) return { error: `비밀번호는 ${MIN_PASSWORD}자 이상이어야 해요.` };

  const supabase = await createSupabaseServerClient();
  const { data, error } =
    intent === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: authErrorMessage(error) };
  if (!data.session) return { error: "가입 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요." };

  // 성공: Supabase가 JWT를 쿠키에 넣었다. 이제부터 요청마다 이 쿠키로 "누구인지" 증명한다.
  redirect("/");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
