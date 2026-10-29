import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import "./globals.css";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "1:1 자기관리 코치",
  description: "기상부터 취침까지 하루 루틴을 챙겨 주는 코치 앱",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>
        <div className={styles.shell}>
          <header className={styles.header}>
            <Link href="/" className={styles.brand}>
              🧭 1:1 코치
            </Link>
            <nav className={styles.nav}>
              <Link href="/">오늘</Link>
              <Link href="/routines">루틴 관리</Link>
            </nav>
          </header>
          <Suspense fallback={null}>
            <UserMenu className={styles.user} />
          </Suspense>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
