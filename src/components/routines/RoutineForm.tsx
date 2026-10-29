"use client";

import { useActionState } from "react";
import { addRoutineAction, deleteRoutineAction, updateRoutineAction } from "@/app/actions";
import SubmitButton from "@/components/SubmitButton";
import { WEEKDAY_LABELS } from "@/lib/time";
import { KIND_INFO, KINDS, type Routine } from "@/lib/types";
import styles from "./routines.module.css";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

/** 루틴 추가(routine 없음) / 수정(routine 있음) 폼 */
export default function RoutineForm({ routine }: { routine?: Routine }) {
  const action = routine ? updateRoutineAction.bind(null, routine.id) : addRoutineAction;
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.row}>
        <select name="kind" defaultValue={routine?.kind ?? "etc"} aria-label="종류" className={styles.kind}>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_INFO[k].emoji} {KIND_INFO[k].label}
            </option>
          ))}
        </select>
        <input
          name="title"
          defaultValue={routine?.title}
          placeholder="이름 (예: 비타민 먹기)"
          aria-label="이름"
          required
          maxLength={100}
        />
      </div>

      <div className={styles.row}>
        <label className={styles.time}>
          시작
          <input type="time" name="start" defaultValue={routine?.startTime} required />
        </label>
        <label className={styles.time}>
          끝 (선택)
          <input type="time" name="end" defaultValue={routine?.endTime ?? ""} />
        </label>
      </div>

      <fieldset className={styles.days}>
        <legend>요일</legend>
        {WEEKDAYS.map((d) => (
          <label key={d} className={styles.day}>
            <input
              type="checkbox"
              name="days"
              value={d}
              defaultChecked={routine ? routine.days.includes(String(d)) : true}
            />
            {WEEKDAY_LABELS[d]}
          </label>
        ))}
      </fieldset>

      <label className={styles.must}>
        <input type="checkbox" name="mustDo" defaultChecked={routine?.mustDo} />꼭 지킬 것 (코치가 더 빨리 챙겨요)
      </label>

      {state?.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}

      <div className={styles.actions}>
        <SubmitButton className={styles.primary}>{routine ? "저장" : "추가"}</SubmitButton>
        {routine && (
          <SubmitButton
            formAction={deleteRoutineAction.bind(null, routine.id)}
            formNoValidate
            className={styles.danger}
            onClick={(e) => {
              if (!confirm(`'${routine.title}' 루틴과 체크 기록을 지울까요?`)) e.preventDefault();
            }}
          >
            삭제
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
