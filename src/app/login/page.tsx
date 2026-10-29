import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Loading from "@/components/Loading";
import LoginForm from "@/components/LoginForm";
import { isSupabaseMode } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Login />
    </Suspense>
  );
}

async function Login() {
  await connection();
  if (!isSupabaseMode()) redirect("/"); // 길 A(로컬)에는 로그인이 없다
  const { user } = await getCurrentUser();
  if (user) redirect("/");
  return <LoginForm />;
}
