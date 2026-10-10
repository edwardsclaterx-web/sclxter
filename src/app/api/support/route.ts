import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getBusinessBySeq, isAdmin } from "@/lib/access";
import {
  appendSupportMessage,
  findOwnerBusiness,
  markSupportRead,
  publicThread,
  threadForBusiness,
} from "@/lib/support";
import { readStore } from "@/lib/store";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const url = new URL(request.url);
  const seqRaw = url.searchParams.get("seq");
  const seq = seqRaw ? Number(seqRaw) : null;
  const data = await readStore();

  if (isAdmin(user)) {
    if (typeof seq !== "number" || !Number.isFinite(seq) || seq < 1) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const biz = await getBusinessBySeq(seq);
    if (!biz) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const thread = await markSupportRead(biz.id, "admin");
    return NextResponse.json({
      ...publicThread(thread ?? threadForBusiness(data, biz.id)),
      businessName: biz.name,
      seq: biz.seq,
    });
  }

  const biz = findOwnerBusiness(user, data);
  if (!biz) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const thread = await markSupportRead(biz.id, "owner");
  return NextResponse.json(publicThread(thread ?? threadForBusiness(await readStore(), biz.id)));
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    content?: string;
    seq?: number;
  };
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  }

  const data = await readStore();
  if (isAdmin(user)) {
    const seq = typeof body.seq === "number" ? body.seq : null;
    if (!seq) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const biz = await getBusinessBySeq(seq);
    if (!biz) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const thread = await appendSupportMessage({
      business: biz,
      from: "admin",
      content,
    });
    return NextResponse.json(publicThread(thread));
  }

  const biz = findOwnerBusiness(user, data);
  if (!biz) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const thread = await appendSupportMessage({
    business: biz,
    from: "owner",
    content,
  });
  return NextResponse.json(publicThread(thread));
}
