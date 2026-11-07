import type { ReactNode } from "react";
import { KBarbersAskAnything } from "./ask-anything";

export const dynamic = "force-dynamic";

export default function KBarbersLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <KBarbersAskAnything />
    </>
  );
}
