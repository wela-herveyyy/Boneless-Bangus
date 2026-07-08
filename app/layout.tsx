import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import Script from "next/script";
import { ThemeSidebar } from "@/components/organisms/ThemeSidebar/ThemeSidebar";
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
  title: "RND Next.js Template",
  description: "Livro Systems RND Next.js template with Atomic Design, Drizzle ORM, and Better Auth",
  appleWebApp: {
    capable: true,
    title: "RND",
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
        <ThemeSidebar />
      </body>
    </html>
  );
}
