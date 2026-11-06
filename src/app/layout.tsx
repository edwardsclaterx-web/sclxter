import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { ChunkRecovery } from "@/components/chunk-recovery";
import { RenewWatch } from "@/components/renew-watch";
import { SiteAskAnything } from "@/components/site-ask-anything";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "sclxter",
  description:
    "The most advanced AI assistant. An AI on your site. It learns your website and the information you have, then interacts with customers - times, prices and more. It's that simple.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const h = await headers();
  const isWidget = h.get("x-sclxter-widget") === "1";
  const primary = h.get("x-sclxter-theme-primary");
  const text = h.get("x-sclxter-theme-text");
  const outline = h.get("x-sclxter-theme-outline");
  const widgetCss =
    isWidget &&
    `html,body{background:transparent!important;color:${
      text || "transparent"
    }!important}`;

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      {widgetCss ? (
        <head>
          <style dangerouslySetInnerHTML={{ __html: widgetCss }} />
        </head>
      ) : null}
      <body
        className={
          isWidget
            ? "min-h-full bg-transparent font-sans"
            : "min-h-full bg-bg font-sans text-fg"
        }
        style={
          isWidget
            ? {
                background: "transparent",
                color: text || "transparent",
                ["--widget-primary" as string]: primary || "transparent",
                ["--widget-text" as string]: text || "transparent",
                ["--widget-outline" as string]: outline || "transparent",
              }
            : undefined
        }
      >
        {children}
        {isWidget ? null : (
          <>
            <ChunkRecovery />
            <RenewWatch />
            <SiteAskAnything />
          </>
        )}
      </body>
    </html>
  );
}
