import { useEffect } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";

import { startAutoSync } from "../components/autoSync";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Автосинхронизация: подтягиваем при старте + проверяем облако каждые 15 секунд
    startAutoSync(15000);
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
