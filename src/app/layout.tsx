import type { Metadata } from "next";
import { Barlow, Geist_Mono } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "投手成長歷程追蹤",
  description: "棒球投手學員訓練紀錄與成長歷程追蹤系統",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-TW"
      className={`${barlow.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Noto Sans/Serif TC: loaded via Google Fonts CSS API, not
            next/font/google — that loader only self-hosts latin/latin-ext/
            cyrillic/vietnamese subsets for these fonts, which excludes the
            Chinese glyphs entirely. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&family=Noto+Serif+TC:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
