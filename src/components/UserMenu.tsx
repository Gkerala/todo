import { connection } from "next/server";
import { signOutAction } from "@/app/login/actions";
import { isSupabaseMode } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import SubmitButton from "./SubmitButton";

/** 길 B에서 로그인한 사람의 이메일과 로그아웃 버튼. 길 A에서는 아무것도 그리지 않는다. */
export default async function UserMenu({ className }: { className?: string }) {
  await connection();
  if (!isSupabaseMode()) return null;
  const { user } = await getCurrentUser();
  if (!user) return null;

  return (
    <form action={signOutAction} className={className}>
      <span>{user.email}</span>
      <SubmitButton>로그아웃</SubmitButton>
    </form>
  );
}
