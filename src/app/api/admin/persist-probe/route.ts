import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/access";
import { getSessionUser } from "@/lib/auth";
import { LEAVESAKE_BIZ_ID, LEAVESAKE_PUBLIC_ID } from "@/lib/leavesake";
import {
  persistEnvNames,
  persistLastError,
  persistPing,
} from "@/lib/persist";
import { readStore, updateStore } from "@/lib/store";
import { normalizeTheme } from "@/lib/widget-theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROOF = {
  outline: "#222222",
  primary: "#ef4444",
  text: "#ffffff",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cycle = url.searchParams.get("cycle") === "leavesake";

  const ping = await persistPing();
  const body: Record<string, unknown> = {
    ping,
    env: persistEnvNames(),
    error: persistLastError() || ping.error || null,
  };

  if (cycle) {
    const user = await getSessionUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    try {
    const beforeStore = await readStore();
    const shop =
      beforeStore.businesses.find(
        (b) => b.id === LEAVESAKE_BIZ_ID || b.publicId === LEAVESAKE_PUBLIC_ID,
      ) ?? null;
    const before = shop ? normalizeTheme(shop.appearance?.theme) : null;
    await updateStore((data) => {
      const row = data.businesses.find(
        (b) => b.id === LEAVESAKE_BIZ_ID || b.publicId === LEAVESAKE_PUBLIC_ID,
      );
      if (!row) return false;
      row.appearance = {
        ...row.appearance,
        colour: PROOF.primary,
        theme: PROOF,
      };
      return true;
    });
    const afterStore = await readStore();
    const afterShop = afterStore.businesses.find(
      (b) => b.id === LEAVESAKE_BIZ_ID || b.publicId === LEAVESAKE_PUBLIC_ID,
    );
    const after = afterShop ? normalizeTheme(afterShop.appearance?.theme) : null;
    if (before) {
      await updateStore((data) => {
        const row = data.businesses.find(
          (b) => b.id === LEAVESAKE_BIZ_ID || b.publicId === LEAVESAKE_PUBLIC_ID,
        );
        if (!row) return false;
        row.appearance = {
          ...row.appearance,
          colour: before.primary,
          theme: before,
        };
        return true;
      });
    }
    const revertedStore = await readStore();
    const revertedShop = revertedStore.businesses.find(
      (b) => b.id === LEAVESAKE_BIZ_ID || b.publicId === LEAVESAKE_PUBLIC_ID,
    );
    body.leavesake = {
      before,
      after,
      reverted: revertedShop
        ? normalizeTheme(revertedShop.appearance?.theme)
        : null,
      stuck: after?.primary === PROOF.primary,
    };
    } catch (err) {
      body.leavesake = {
        error:
          persistLastError() ||
          (err instanceof Error ? err.message : "cycle failed"),
      };
    }
  }

  const res = NextResponse.json(body);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
