"use client";

import { useEffect, useState } from "react";
import { SupportThread } from "@/components/support-thread";

export const OWNER_CONTACT_COPY =
  "Since you own a sclxter assistant, for priority contact and quicker replies, message here. (contact with a real person)";

export function OwnerSupport() {
  const [focusChat, setFocusChat] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "support" || hash === "chat") setFocusChat(true);
  }, []);

  return (
    <section className="mt-14">
      <p className="text-sm leading-6 text-muted">{OWNER_CONTACT_COPY}</p>
      <div className="mt-6">
        <SupportThread endpoint="/api/support" autoFocus={focusChat} />
      </div>
    </section>
  );
}
