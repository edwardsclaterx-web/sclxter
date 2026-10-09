import type { StoreData } from "./types";

export const DEMO_PUBLIC_ID = "northgate";

const now = "2026-10-01T09:00:00.000Z";

export function ensureDemoIndustry(data: StoreData) {
  const demo = data.businesses.find(
    (b) => b.publicId === DEMO_PUBLIC_ID || b.id === "biz_northgate",
  );
  if (demo && !(demo.industry || "").trim()) demo.industry = "Barber";
}

export function seedIfEmpty(data: StoreData) {
  if (data.businesses.some((b) => b.publicId === DEMO_PUBLIC_ID)) return;

  data.businesses.push({
    id: "biz_northgate",
    seq: 0,
    ownerId: null,
    name: "Northgate Barbers",
    websiteUrl: "/demo",
    industry: "Barber",
    contactPhone: "01904 555 018",
    contactEmail: "",
    contactOther: "14 Northgate, York YO1 7HH",
    tone: "warm",
    notepad: "",
    scannedAt: null,
    industryBriefing: "",
    industryBriefingFor: "",
    publicId: DEMO_PUBLIC_ID,
    appearance: {
      assistantName: "Northgate",
      colour: "#ffffff",
      welcome: "Ask about cuts, prices, hours, or booking.",
    },
    widgetConnectedAt: null,
    createdAt: now,
  });

  const notes: Array<{ title: string; body: string }> = [
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

  for (const note of notes) {
    data.knowledge.push({
      id: `know_demo_${note.title.toLowerCase().replace(/\s+/g, "_")}`,
      businessId: "biz_northgate",
      source: "note",
      title: note.title,
      body: note.body,
      createdAt: now,
      updatedAt: now,
    });
  }
}
