import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://reosion.vercel.app"),
  title: {
    default: "Reosion — Motion graphics, written in React",
    template: "%s · Reosion",
  },
  description:
    "Build animations with React, Tailwind and Motion. Preview instantly. Export to video — on your machine. Local-first, open source.",
  keywords: [
    "motion graphics",
    "react animation",
    "video export",
    "framer motion",
    "webcodecs",
    "local-first",
    "code-first animation",
    "reosion",
  ],
  authors: [{ name: "Muhammad Kaif Nazeer" }],
  creator: "Muhammad Kaif Nazeer",
  publisher: "Muhammad Kaif Nazeer",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://reosion.vercel.app",
    siteName: "Reosion",
    title: "Reosion — Motion graphics, written in React",
    description:
      "Build animations with React, Tailwind and Motion. Preview instantly. Export to video — on your machine.",
    images: [
      {
        url: "/icon.svg",
        width: 32,
        height: 32,
        alt: "Reosion logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Reosion — Motion graphics, written in React",
    description:
      "Build animations with React, Tailwind and Motion. Preview instantly. Export to video — on your machine.",
    creator: "@MuhammadKaifNazeer",
  },
  alternates: {
    canonical: "https://reosion.vercel.app",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
