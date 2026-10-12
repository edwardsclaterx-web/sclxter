import {
  NORTHGATE_BIZ_ID,
  NORTHGATE_LOGIN,
  NORTHGATE_USER_ID,
  isNorthgateLogin,
} from "./northgate";
import type { StoreData } from "./types";

export const DEMO_PUBLIC_ID = "northgate";
export {
  NORTHGATE_BIZ_ID,
  NORTHGATE_LOGIN,
  NORTHGATE_USER_ID,
  isNorthgateLogin,
} from "./northgate";

const now = "2026-10-01T09:00:00.000Z";

const DEMO_NOTES: Array<{ title: string; body: string }> = [
  {
    title: "Hours",
    body: "Tuesday to Friday 9:00–18:00. Saturday 8:30–16:00. Closed Sunday and Monday. Last cut starts 20 minutes before close.",
  },
  {
    title: "Cuts and prices",
    body: "Skin fade £21. Classic cut £18. Beard trim £12. Cut and beard £30. Kids’ cut (under 12) £14. Hot towel shave £25. Cash and cards. Prices include a consultation.",
  },
  {
    title: "Walk-in and booking",
    body: "Weekdays are mostly walk-in. Saturday mornings fill up — call 01904 555 018 to hold a time. We do not take bookings through the website yet. Same-day weekday waits are usually under 20 minutes before 4pm.",
  },
  {
    title: "Shop",
    body: "Northgate Barbers, 14 Northgate, York YO1 7HH. Independent shop, two chairs. Street parking nearby. Phone 01904 555 018.",
  },
];

export const DEMO_NOTEPAD = DEMO_NOTES.map(
  (note) => `### ${note.title}\n${note.body}`,
).join("\n\n");

function demoBusiness() {
  return {
    id: NORTHGATE_BIZ_ID,
    seq: 0,
    ownerId: NORTHGATE_USER_ID,
    name: "Northgate Barbers",
    websiteUrl: "/demo",
    industry: "Barber",
    contactPhone: "01904 555 018",
    contactEmail: "",
    contactOther: "14 Northgate, York YO1 7HH",
    tone: "warm",
    notepad: DEMO_NOTEPAD,
    lastScanText: "",
    scannedAt: null,
    industryBriefing: "",
    industryBriefingFor: "",
    publicId: DEMO_PUBLIC_ID,
    appearance: {
      assistantName: "Northgate",
      colour: "#ffffff",
      welcome: "Ask about cuts, prices, hours, or booking.",
      theme: {
        outline: "#222222",
        primary: "#ffffff",
        text: "#000000",
      },
    },
    widgetConnectedAt: null,
    createdAt: now,
  };
}

export function ensureDemoIndustry(data: StoreData) {
  const demo = data.businesses.find(
    (b) => b.publicId === DEMO_PUBLIC_ID || b.id === NORTHGATE_BIZ_ID,
  );
  if (demo && !(demo.industry || "").trim()) demo.industry = "Barber";
}

function ensureKnowledge(data: StoreData) {
  for (const note of DEMO_NOTES) {
    const kid = `know_demo_${note.title.toLowerCase().replace(/\s+/g, "_")}`;
    if (data.knowledge.some((k) => k.id === kid)) continue;
    data.knowledge.push({
      id: kid,
      businessId: NORTHGATE_BIZ_ID,
      source: "note",
      title: note.title,
      body: note.body,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export function ensureNorthgateShop(data: StoreData) {
  let user = data.users.find(
    (u) => u.id === NORTHGATE_USER_ID || isNorthgateLogin(u.email),
  );
  if (!user) {
    user = {
      id: NORTHGATE_USER_ID,
      email: NORTHGATE_LOGIN,
      passwordHash: "!",
      createdAt: now,
    };
    data.users.push(user);
  } else {
    user.email = NORTHGATE_LOGIN;
    user.passwordHash = "!";
  }
  if (!user.paidUntil) {
    user.paidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  let demo = data.businesses.find(
    (b) => b.publicId === DEMO_PUBLIC_ID || b.id === NORTHGATE_BIZ_ID,
  );
  if (!demo) {
    data.businesses.push(demoBusiness());
  } else {
    demo.ownerId = NORTHGATE_USER_ID;
    if (!(demo.name || "").trim()) demo.name = "Northgate Barbers";
    if (!(demo.websiteUrl || "").trim()) demo.websiteUrl = "/demo";
    if (!(demo.industry || "").trim()) demo.industry = "Barber";
    if (!(demo.notepad || "").trim()) demo.notepad = DEMO_NOTEPAD;
    if (!(demo.contactPhone || "").trim()) demo.contactPhone = "01904 555 018";
    if (!(demo.contactOther || "").trim()) {
      demo.contactOther = "14 Northgate, York YO1 7HH";
    }
  }
  ensureKnowledge(data);
}

export function seedIfEmpty(data: StoreData) {
  ensureNorthgateShop(data);
}
