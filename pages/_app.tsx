import { useEffect } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";

import { startAutoSync } from "../components/autoSync";
import "../styles/globals.css";

const LS_THEME = "prikorm.theme"; // "light" | "dark"

function applyTheme(theme: "light" | "dark") {
  if (typeof window === "undefined") return;
  const root = document.documentElement; // <html>
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Автосинхронизация
    startAutoSync(15000);

    // Тема
    try {
      const saved = (window.localStorage.getItem(LS_THEME) as "light" | "dark" | null) ?? "light";
      applyTheme(saved);
    } catch {
      applyTheme("light");
    }
  }, []);

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111827" />
        <title>Прикорм-трекер</title>
      </Head>

      <Component {...pageProps} />
    </>
  );
}
