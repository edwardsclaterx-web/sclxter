import { NextResponse } from "next/server";
import { isAdmin, listedBusinesses } from "@/lib/access";
import { getSessionUser, setSessionCookie } from "@/lib/auth";
import { LEAVESAKE_BIZ_ID, LEAVESAKE_PUBLIC_ID } from "@/lib/leavesake";
import { verifyOwnerPassword } from "@/lib/owner-auth";
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

const TEST_SHOP_EMAIL = "persistcheck1793726816@example.com";

function isExampleTestOwner(email: string) {
  const v = email.trim().toLowerCase();
  return v === TEST_SHOP_EMAIL || v.endsWith("@example.com");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    password?: string;
    action?: string;
    prev?: { paidUntil?: string | null; setupPaid?: boolean };
  };
  if (!(await verifyOwnerPassword(body.password || ""))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const data = await readStore();
  const user = data.users.find((u) => isExampleTestOwner(u.email));
  if (!user) {
    return NextResponse.json({ error: "No example test shop." }, { status: 404 });
  }
  const shop = listedBusinesses(data).find((b) => b.ownerId === user.id);

  if (body.action === "restore") {
    await updateStore((store) => {
      const row = store.users.find((u) => u.id === user.id);
      if (!row) return false;
      const paidUntil = body.prev?.paidUntil;
      if (typeof paidUntil === "string" && paidUntil) row.paidUntil = paidUntil;
      else delete row.paidUntil;
      row.setupPaid = body.prev?.setupPaid === true;
      return true;
    });
    const res = NextResponse.json({
      ok: true,
      restored: true,
      publicId: shop?.publicId ?? null,
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  if (body.action !== "lapse") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const prev = {
    paidUntil: user.paidUntil ?? null,
    setupPaid: user.setupPaid === true,
  };
  await updateStore((store) => {
    const row = store.users.find((u) => u.id === user.id);
    if (!row) return false;
    row.paidUntil = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    row.setupPaid = true;
    return true;
  });
  const res = NextResponse.json({
    ok: true,
    lapsed: true,
    prev,
    publicId: shop?.publicId ?? null,
  });
  await setSessionCookie(user.id, res, request);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
