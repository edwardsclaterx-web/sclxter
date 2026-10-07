import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SCLXTER",
  description:
    "The most advanced AI assistant. An AI on your site. It learns your website and the information you have, then interacts with customers - times, prices and more. It's that simple.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg font-sans text-fg">{children}</body>
    </html>
  );
}
