import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Loading from "@/components/Loading";
import RoutineForm from "@/components/routines/RoutineForm";
import styles from "@/components/routines/routines.module.css";
import { getRepo } from "@/lib/repo";
import type { Routine } from "@/lib/types";

/** 저장 후 새 값으로 폼을 다시 그리기 위한 key (값이 바뀌면 key가 바뀐다) */
function formKey(r: Routine) {
  return [r.id, r.title, r.kind, r.startTime, r.endTime, r.days, r.mustDo].join("|");
}

export default function RoutinesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Routines />
    </Suspense>
  );
}

async function Routines() {
  await connection(); // 내 데이터를 읽는 화면이라 요청 때마다 만든다
  const repo = await getRepo();
  const [settings, routines] = await Promise.all([repo.getSettings(), repo.listRoutines()]);
  if (!settings) redirect("/");

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>루틴 관리</h1>
        <p className={styles.muted}>
          기상 {settings.wakeTime} · 취침 {settings.sleepTime} · 코치가 만든 기본 루틴을 내 하루에 맞게 고쳐 보세요.
        </p>
      </div>

      <details className={styles.addBox}>
        <summary>+ 새 루틴 추가</summary>
        <RoutineForm />
      </details>

      {routines.length === 0 ? (
        <p className={styles.muted}>루틴이 없어요. 위에서 추가해 보세요.</p>
      ) : (
        <ul className={styles.list}>
          {routines.map((r) => (
            <li key={formKey(r)} className={styles.card}>
              <RoutineForm routine={r} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
