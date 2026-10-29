"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ padding: "24px 0" }}>
      <h2>문제가 생겼어요 😥</h2>
      <p style={{ color: "var(--muted)" }}>{error.message}</p>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
