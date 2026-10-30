import {
  LEAVESAKE_BIZ_ID,
  LEAVESAKE_LOGIN,
  LEAVESAKE_PUBLIC_ID,
  LEAVESAKE_SITE,
  LEAVESAKE_USER_ID,
  isLeavesakeLogin,
} from "./leavesake";
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

const LEAVESAKE_NOTES: Array<{ title: string; body: string }> = [
  {
    title: "What it is",
    body: "Leavesake is a personal running site at https://leavesake.com. Tagline: Run. Reflect. Repeat. Personal articles on cadence, headspace, weather, and why we keep going — honestly told, not expert coaching. It is not a coaching service.",
  },
  {
    title: "Running index",
    body: "Source: https://leavesake.com/running/\n23 personal articles. Index: What they miss https://leavesake.com/running/what-they-miss/ ; Do you say hello? https://leavesake.com/running/do-you-say-hello/ ; I love the watch. I still cannot see my running. https://leavesake.com/running/i-love-the-watch/ ; What do you need for a sub-25 5K? https://leavesake.com/running/what-do-you-need-for-a-sub-25-5k/ ; What Is an Easy Pace Anyway? https://leavesake.com/running/what-is-an-easy-pace-anyway/ ; Three Years Later https://leavesake.com/running/three-years-later/ ; Where Did the Time Go? https://leavesake.com/running/where-did-the-time-go/ ; Breaking Up Is Hard https://leavesake.com/running/breaking-up-is-hard/ ; Finding Your Rhythm https://leavesake.com/running/finding-your-rhythm/ ; Running as Meditation https://leavesake.com/running/running-as-meditation/ ; Who Cares About V02 Max https://leavesake.com/running/who-cares-about-v02-max/ ; Winter Miles For Summer Smiles https://leavesake.com/running/winter-miles-for-summer-smiles/ ; 7 Benefits of Running You Might Not Know https://leavesake.com/running/7-benefits-of-running-you-might-not-know/ ; 10 Tips for Setting and Achieving Your Running Goals https://leavesake.com/running/10-tips-for-setting-and-achieving-your-running-goals/ ; 10 Tips to Improve Your Running Speed https://leavesake.com/running/10-tips-to-improve-your-running-speed/ ; New Years Resolution To Run https://leavesake.com/running/new-years-resolution-to-run/ ; Go Running on Christmas Day? https://leavesake.com/running/go-running-on-christmas-day/ ; Can A Book Help Me To Run? https://leavesake.com/running/can-a-book-help-me-to-run/ ; How Can I Motivate Myself To Run? https://leavesake.com/running/how-can-i-motivate-myself-to-run/ ; Should I Run If Sick or Injured? https://leavesake.com/running/should-i-run-if-sick-or-injured/ ; Do I Think When Running? https://leavesake.com/running/do-i-think-when-running/ ; Do I Have To Race If I Run? https://leavesake.com/running/do-i-have-to-race-if-i-run/ ; Should I Start Running? https://leavesake.com/running/should-i-start-running/",
  },
  {
    title: "Tools",
    body: "Source: https://leavesake.com/running-tools/\nRunning tools including Can I run my target time? https://leavesake.com/running-tools/can-i-run-my-target-time/",
  },
];

export const LEAVESAKE_NOTEPAD = LEAVESAKE_NOTES.map(
  (note) => `### ${note.title}\n${note.body}`,
).join("\n\n");

function leavesakeBusiness(seq: number) {
  return {
    id: LEAVESAKE_BIZ_ID,
    seq,
    ownerId: LEAVESAKE_USER_ID,
    name: "Leavesake",
    websiteUrl: LEAVESAKE_SITE,
    industry: "Running",
    contactPhone: "",
    contactEmail: "",
    contactOther: LEAVESAKE_SITE,
    tone: "warm",
    notepad: LEAVESAKE_NOTEPAD,
    lastScanText: "",
    scannedAt: null,
    industryBriefing: "",
    industryBriefingFor: "",
    publicId: LEAVESAKE_PUBLIC_ID,
    appearance: {
      assistantName: "Leavesake",
      colour: "#ffffff",
      welcome: "Ask about the running articles, cadence, or the site.",
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

function ensureLeavesakeKnowledge(data: StoreData) {
  for (const note of LEAVESAKE_NOTES) {
    const kid = `know_leavesake_${note.title.toLowerCase().replace(/\s+/g, "_")}`;
    if (data.knowledge.some((k) => k.id === kid)) continue;
    data.knowledge.push({
      id: kid,
      businessId: LEAVESAKE_BIZ_ID,
      source: "note",
      title: note.title,
      body: note.body,
      createdAt: now,
      updatedAt: now,
    });
  }
}

function nextUnusedSeq(data: StoreData, selfId: string) {
  const taken = new Set(
    data.businesses.filter((b) => b.id !== selfId).map((b) => b.seq),
  );
  let seq = 0;
  while (taken.has(seq)) seq += 1;
  return seq;
}

export function ensureLeavesakeShop(data: StoreData) {
  let user = data.users.find(
    (u) => u.id === LEAVESAKE_USER_ID || isLeavesakeLogin(u.email),
  );
  if (!user) {
    user = {
      id: LEAVESAKE_USER_ID,
      email: LEAVESAKE_LOGIN,
      passwordHash: "!",
      createdAt: now,
    };
    data.users.push(user);
  } else {
    user.email = LEAVESAKE_LOGIN;
    user.passwordHash = "!";
  }
  if (!user.paidUntil) {
    user.paidUntil = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
  }

  let shop = data.businesses.find(
    (b) => b.publicId === LEAVESAKE_PUBLIC_ID || b.id === LEAVESAKE_BIZ_ID,
  );
  if (!shop) {
    data.businesses.push(leavesakeBusiness(nextUnusedSeq(data, LEAVESAKE_BIZ_ID)));
  } else {
    shop.ownerId = LEAVESAKE_USER_ID;
    shop.publicId = LEAVESAKE_PUBLIC_ID;
    if (typeof shop.seq !== "number" || shop.seq < 0) {
      shop.seq = nextUnusedSeq(data, LEAVESAKE_BIZ_ID);
    }
    if (!(shop.name || "").trim()) shop.name = "Leavesake";
    if (!(shop.websiteUrl || "").trim()) shop.websiteUrl = LEAVESAKE_SITE;
    if (!(shop.industry || "").trim()) shop.industry = "Running";
    if (
      !(shop.notepad || "").trim() ||
      (!(shop.lastScanText || "").trim() &&
        !/leavesake\.com\/running\//.test(shop.notepad || ""))
    ) {
      shop.notepad = LEAVESAKE_NOTEPAD;
    }
    if (!(shop.contactOther || "").trim()) shop.contactOther = LEAVESAKE_SITE;
  }
  ensureLeavesakeKnowledge(data);
}

export function seedIfEmpty(data: StoreData) {
  ensureNorthgateShop(data);
  ensureLeavesakeShop(data);
}
