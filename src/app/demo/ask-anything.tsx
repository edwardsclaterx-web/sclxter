"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PUBLIC_ID = "northgate";
const HOST_ID = "northgate-ask-host";
const PANEL_ID = "northgate-ask-panel";
const BTN_ID = "northgate-ask-btn";
const OPEN_KEY = `sclxter:ask:${PUBLIC_ID}:open`;
const LAYER = 2147483000;
const BOOT_FLAG = "__sclxterDemoAskBoot";

function onDemo() {
  const p = location.pathname || "";
  if (p.indexOf("/demo/k-barbers") === 0) return false;
  return p.indexOf("/demo") === 0;
}

function readOpen() {
  try {
    return sessionStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

function placeLauncher(host: HTMLElement, panel: HTMLElement) {
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  if (mobile) {
    host.style.left = "12px";
    host.style.right = "12px";
    host.style.bottom = "max(12px, env(safe-area-inset-bottom, 0px))";
    host.style.width = "auto";
    panel.style.left = "0";
    panel.style.right = "0";
    panel.style.width = "auto";
    panel.style.bottom = "64px";
    panel.style.height =
      "min(560px, calc(100dvh - 92px - env(safe-area-inset-bottom, 0px)))";
    panel.style.maxHeight =
      "calc(100dvh - 92px - env(safe-area-inset-bottom, 0px))";
  } else {
    host.style.left = "";
    host.style.right = "20px";
    host.style.bottom = "20px";
    host.style.width = "";
    panel.style.left = "";
    panel.style.right = "0";
    panel.style.width = "min(380px, calc(100vw - 32px))";
    panel.style.bottom = "60px";
    panel.style.height = "min(520px, calc(100vh - 96px))";
    panel.style.maxHeight = "";
  }
}

function applyOpen(panel: HTMLElement, btn: HTMLElement, open: boolean) {
  const host = document.getElementById(HOST_ID);
  if (host) placeLauncher(host, panel);
  panel.style.border = "0";
  panel.style.background = "transparent";
  panel.style.overflow = "visible";
  panel.style.borderRadius = "0";
  panel.style.colorScheme = "normal";
  panel.style.visibility = open ? "visible" : "hidden";
  panel.style.opacity = open ? "1" : "0";
  panel.style.pointerEvents = open ? "auto" : "none";
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.textContent = open ? "Minimise" : "Ask anything";
  btn.setAttribute("aria-label", open ? "Minimise" : "Ask anything");
  btn.style.setProperty("border-radius", "20px", "important");
  try {
    sessionStorage.setItem(OPEN_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function syncDemo() {
  const host = document.getElementById(HOST_ID);
  if (!host) return;
  host.style.display = onDemo() ? "" : "none";
}

function boot() {
  const w = window as Window & { [BOOT_FLAG]?: boolean };
  const existing = document.getElementById(HOST_ID);
  if (existing) {
    const p = document.getElementById(PANEL_ID);
    const b = document.getElementById(BTN_ID);
    if (p && b) applyOpen(p, b, readOpen());
    syncDemo();
    if (w[BOOT_FLAG]) return;
  }
  if (w[BOOT_FLAG]) {
    syncDemo();
    return;
  }
  w[BOOT_FLAG] = true;
  if (!onDemo()) return;
  if (document.getElementById(HOST_ID)) {
    syncDemo();
    return;
  }

  const root = document.createElement("div");
  root.id = HOST_ID;
  root.style.cssText = `position:fixed;right:20px;bottom:20px;z-index:${LAYER};pointer-events:auto;display:flex;flex-direction:column;align-items:flex-end;gap:0;`;
  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.style.cssText = `position:absolute;right:0;bottom:60px;width:min(380px, calc(100vw - 32px));height:min(520px, calc(100vh - 96px));border:0;background:transparent;overflow:visible;z-index:${LAYER};`;
  const iframe = document.createElement("iframe");
  iframe.title = "Ask anything";
  iframe.name = "northgate-ask-frame";
  iframe.src = `/widget/${PUBLIC_ID}?from=${encodeURIComponent(location.origin)}`;
  iframe.setAttribute("allowtransparency", "true");
  iframe.style.cssText =
    "width:100%;height:100%;border:0;background:transparent;color-scheme:normal;opacity:1;overflow:visible;pointer-events:auto;";
  panel.appendChild(iframe);
  const btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.type = "button";
  btn.setAttribute("aria-label", "Ask anything");
  btn.textContent = "Ask anything";
  btn.style.cssText =
    `position:relative;z-index:${LAYER};pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;height:52px;min-width:52px;padding:0 28px;border:0;border-radius:20px;background:#ffffff;color:#050505;font-family:inherit;font-size:14px;font-weight:600;letter-spacing:0.06em;cursor:pointer;appearance:none;-webkit-appearance:none;overflow:hidden;`;
  btn.style.setProperty("border-radius", "20px", "important");
  applyOpen(panel, btn, readOpen());
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    applyOpen(panel, btn, btn.getAttribute("aria-expanded") !== "true");
  });
  const stop = (e: Event) => {
    e.stopPropagation();
  };
  root.addEventListener("mousedown", stop);
  root.addEventListener("pointerdown", stop);
  root.addEventListener("click", stop);
  panel.addEventListener("mousedown", stop);
  panel.addEventListener("pointerdown", stop);
  panel.addEventListener("click", stop);
  root.appendChild(panel);
  root.appendChild(btn);
  document.body.appendChild(root);
  window.addEventListener("popstate", syncDemo);
  window.addEventListener("resize", () => {
    const p = document.getElementById(PANEL_ID);
    const b = document.getElementById(BTN_ID);
    if (p && b) applyOpen(p, b, b.getAttribute("aria-expanded") === "true");
  });
}

export function AskAnything() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      boot();
    } catch {
      /* keep the demo page up if the ask layer fails */
    }
  }, [pathname]);
  return null;
}
