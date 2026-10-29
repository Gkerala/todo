"use client";

import { useFormStatus } from "react-dom";

/** 제출 중에는 눌리지 않게 막아서, 두 번 눌러 두 번 저장되는 일을 막는다 */
export default function SubmitButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return <button type="submit" {...props} disabled={pending || props.disabled} />;
}
