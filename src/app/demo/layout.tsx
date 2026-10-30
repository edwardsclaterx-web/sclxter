import type { ReactNode } from "react";
import { AskAnything } from "./ask-anything";

export const dynamic = "force-dynamic";

export default async function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="relative z-0">{children}</div>
      <AskAnything />
    </>
  );
}
