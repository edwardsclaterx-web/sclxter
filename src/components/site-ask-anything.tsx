"use client";

import { useEffect } from "react";

const PUBLIC_ID = "sclxter";
const HOST_ID = "sclxter-site-ask-host";
const PANEL_ID = "sclxter-site-ask-panel";
const BTN_ID = "sclxter-site-ask-btn";
const HINT_ID = "sclxter-site-ask-hint";
const OPEN_KEY = `sclxter:ask:${PUBLIC_ID}:open`;
const LAYER = 2147483000;
const BOOT_FLAG = "__sclxterSiteAskBoot";
const HINT_HTML =
  '<span style="font-size:11px;font-weight:600;letter-spacing:0.04em">AI assistant here</span><span aria-hidden="true" style="display:flex;flex-direction:column;align-items:center;line-height:0"><span style="width:1px;height:30px;background:#f4f4f4"></span><span style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #f4f4f4"></span></span>';
const HINT_CSS =
  "display:flex;flex-direction:column;align-items:center;gap:4px;margin-bottom:12px;pointer-events:none;color:#f4f4f4;font-family:inherit;";

function skipPath() {
  const p = location.pathname || "";
  return (
    p.indexOf("/demo") === 0 ||
    p.indexOf("/widget") === 0 ||
    p.indexOf("/dashboard") === 0 ||
    p === "/login" ||
    p.indexOf("/login/") === 0 ||
    p === "/signup" ||
    p.indexOf("/signup/") === 0 ||
    p === "/account" ||
    p.indexOf("/account/") === 0 ||
    p === "/buy" ||
    p.indexOf("/buy/") === 0 ||
    p === "/billing" ||
    p.indexOf("/billing/") === 0
  );
}

function readOpen() {
  try {
    return sessionStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

function applyOpen(panel: HTMLElement, btn: HTMLElement, open: boolean) {
  panel.style.visibility = open ? "visible" : "hidden";
  panel.style.opacity = open ? "1" : "0";
  panel.style.pointerEvents = open ? "auto" : "none";
  panel.style.bottom = "60px";
  panel.style.height = "min(520px, calc(100vh - 96px))";
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.textContent = open ? "Minimise" : "Ask anything";
  btn.setAttribute("aria-label", open ? "Minimise" : "Ask anything");
  btn.style.setProperty("border-radius", "20px", "important");
  const h = document.getElementById(HINT_ID);
  if (h) h.style.display = open ? "none" : "flex";
  try {
    sessionStorage.setItem(OPEN_KEY, open ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function sync() {
  const host = document.getElementById(HOST_ID);
  if (host) host.style.display = skipPath() ? "none" : "";
  const demo = document.getElementById("northgate-ask-host");
  const onDemo = (location.pathname || "").indexOf("/demo") === 0;
  if (demo) demo.style.display = onDemo ? "" : "none";
}

function paintHint(h: HTMLElement) {
  h.style.cssText = HINT_CSS;
  h.innerHTML = HINT_HTML;
}

function ensureHost() {
  const existing = document.getElementById(HOST_ID);
  const hostCss = `position:fixed;right:20px;bottom:20px;z-index:${LAYER};pointer-events:auto;display:flex;flex-direction:column;align-items:flex-end;gap:0;`;
  if (existing) {
    existing.style.cssText = hostCss;
    const p = document.getElementById(PANEL_ID);
    const b = document.getElementById(BTN_ID);
    const h = document.getElementById(HINT_ID);
    if (h) paintHint(h);
    if (p && b) applyOpen(p, b, readOpen());
    sync();
    return;
  }
  if (skipPath()) return;
  const root = document.createElement("div");
  root.id = HOST_ID;
  root.style.cssText = hostCss;
  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.style.cssText = `position:absolute;right:0;bottom:60px;width:min(380px, calc(100vw - 32px));height:min(520px, calc(100vh - 96px));border:1px solid #222;border-radius:24px;background:#050505;overflow:hidden;z-index:${LAYER};`;
  const iframe = document.createElement("iframe");
  iframe.title = "Ask anything";
  iframe.name = "sclxter-site-ask-frame";
  iframe.src = `/widget/${PUBLIC_ID}?from=${encodeURIComponent(location.origin)}`;
  iframe.style.cssText =
    "width:100%;height:100%;border:0;background:#050505;pointer-events:auto;";
  panel.appendChild(iframe);
  const hint = document.createElement("div");
  hint.id = HINT_ID;
  paintHint(hint);
  const btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.type = "button";
  btn.setAttribute("aria-label", "Ask anything");
  btn.textContent = "Ask anything";
  btn.style.cssText = `position:relative;z-index:${LAYER};pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;height:52px;min-width:52px;padding:0 28px;border:0;border-radius:20px;background:#ffffff;color:#050505;font-family:inherit;font-size:14px;font-weight:600;letter-spacing:0.06em;cursor:pointer;appearance:none;-webkit-appearance:none;overflow:hidden;`;
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
  root.appendChild(panel);
  root.appendChild(hint);
  root.appendChild(btn);
  document.body.appendChild(root);
}

function onRoute() {
  if (!skipPath()) ensureHost();
  sync();
}

function boot() {
  const w = window as Window & { [BOOT_FLAG]?: boolean };
  if (w[BOOT_FLAG]) {
    onRoute();
    return;
  }
  w[BOOT_FLAG] = true;
  onRoute();
  window.addEventListener("popstate", onRoute);
  const push = history.pushState.bind(history);
  history.pushState = (...args) => {
    push(...args);
    onRoute();
  };
  const replace = history.replaceState.bind(history);
  history.replaceState = (...args) => {
    replace(...args);
    onRoute();
  };
}

export function SiteAskAnything() {
  useEffect(() => {
    boot();
  }, []);
  return null;
}
