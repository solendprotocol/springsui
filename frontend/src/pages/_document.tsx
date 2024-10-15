import { Head, Html, Main, NextScript } from "next/document";

import { TWITTER } from "@/lib/constants";

export default function Document() {
  const description = "LST";

  return (
    <Html lang="en">
      <Head>
        <meta name="description" content={description} />
        <link rel="icon" href="/android-chrome-512x512.png" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="SpringSui" />
        <meta
          property="og:image"
          content="https://www.springsui.com/android-chrome-512x512.png"
        />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:site" content={TWITTER} />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#8FDDFF" />
        <meta name="msapplication-TileColor" content="#8FDDFF" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
