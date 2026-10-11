import { NextResponse } from "next/server";
import { getOrCreateBusiness, getSessionUser } from "@/lib/auth";
import { publicEmbedGate, readEmbedFrom } from "@/lib/embed-host";
import { id } from "@/lib/ids";
import { readStore, updateStore } from "@/lib/store";

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "content-type");
  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
    publicId?: string | null;
    from?: unknown;
  };
  const name = body.name?.trim() ?? "";
  const phone = body.phone?.trim() ?? "";
  if (!name || !phone) {
    return cors(
      NextResponse.json({ error: "Name and phone are needed." }, { status: 400 }),
    );
  }

  const data = await readStore();
  const pageOrigin = readEmbedFrom(request, body);
  let business = body.publicId
    ? data.businesses.find((b) => b.publicId === body.publicId)
    : null;
  if (!business) {
    const user = await getSessionUser();
    if (!user) {
      return cors(
        NextResponse.json({ error: "Unknown shop." }, { status: 404 }),
      );
    }
    business = await getOrCreateBusiness(user);
    if (!business) {
      return cors(
        NextResponse.json({ error: "Unknown shop." }, { status: 404 }),
      );
    }
  } else {
    const gate = publicEmbedGate(request, business, data, pageOrigin);
    if (!gate.ok) {
      return cors(
        NextResponse.json({ error: gate.error }, { status: gate.status }),
      );
    }
  }

  const lead = await updateStore((store) => {
    const row = {
      id: id("lead"),
      businessId: business!.id,
      conversationId: null as string | null,
      name,
      phone,
      email: body.email?.trim() ?? "",
      message: body.message?.trim() ?? "",
      createdAt: new Date().toISOString(),
    };
    store.leads.push(row);
    return row;
  });

  return cors(NextResponse.json({ lead }));
}
