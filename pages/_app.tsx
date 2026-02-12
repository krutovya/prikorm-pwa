import { useEffect } from "react";
import { startAutoSync } from "../components/autoSync";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#111827" />
        <title>Прикорм-трекер</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
