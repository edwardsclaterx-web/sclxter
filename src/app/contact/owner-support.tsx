"use client";

import { useEffect } from "react";
import { SupportThread } from "@/components/support-thread";

export const OWNER_CONTACT_COPY =
  "Since you own a sclxter assistant, for priority contact and quicker replies, message here. (contact with a real person)";

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
      <p className="text-sm leading-6 text-muted">{OWNER_CONTACT_COPY}</p>
      <div className="mt-6">
        <SupportThread endpoint="/api/support" viewer="owner" />
      </div>
    </section>
  );
}
