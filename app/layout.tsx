import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Manrope } from "next/font/google";
import Script from "next/script";
import { RightSidebars } from "@/components/organisms/RightSidebars/RightSidebars";
import { ErpEmbedBootstrap } from "@/components/organisms/ErpEmbedBootstrap/ErpEmbedBootstrap";
import { THEME_INIT_SCRIPT } from "@/lib/theme/theme-init";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Giya",
  description:
    "Giya — Livro Systems' internal assistant that guides tasks, QA, and school setup.",
  appleWebApp: {
    capable: true,
    title: "Giya",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-(family-name:--font-inter)">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {children}
        <Suspense fallback={null}>
          <ErpEmbedBootstrap />
          <RightSidebars />
        </Suspense>
      </body>
    </html>
  );
}
