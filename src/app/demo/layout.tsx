import type { ReactNode } from "react";
import { AskAnything } from "./ask-anything";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AskAnything />
    </>
  );
}
