import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { SiteFooter } from "@/components/chrome";

export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 md:px-8 md:py-20">
        <h1 className="text-3xl font-medium tracking-tight">{title}</h1>
        <div className="mt-10 space-y-6 text-sm leading-7 text-muted [&_a]:text-fg [&_h2]:pt-4 [&_h2]:text-base [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:text-fg [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function LegalNotice() {
  return (
    <p>
      This page is written in plain English for sclxter.com. It is not legal
      advice and is not a substitute for a solicitor. UK data protection is
      mainly the UK GDPR and the Data Protection Act 2018. If you need advice
      for your business, speak to a solicitor or the Information
      Commissioner&apos;s Office (ICO).
    </p>
  );
}
