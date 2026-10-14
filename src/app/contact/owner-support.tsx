"use client";

import { useEffect } from "react";
import { SupportThread } from "@/components/support-thread";

export function OwnerSupport() {
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "support" || hash === "chat") {
      document.getElementById("support")?.scrollIntoView({ block: "start" });
      document.getElementById("support-input")?.focus();
    }
  }, []);

  return (
    <section className="mt-14">
      <SupportThread endpoint="/api/support" viewer="owner" />
    </section>
  );
}
