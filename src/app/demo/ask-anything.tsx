"use client";

import { useEffect } from "react";

const PUBLIC_ID = "northgate";
const HOST_ID = "northgate-ask-host";
const PANEL_ID = "northgate-ask-panel";
const BTN_ID = "northgate-ask-btn";
const OPEN_KEY = `sclxter:ask:${PUBLIC_ID}:open`;
const LAYER = 2147483000;

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
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  try {
    sessionStorage.setItem(OPEN_KEY, open ? "1" : "0");
  } catch {
    /* ignore quota */
  }
}

function ensureHost() {
  const existing = document.getElementById(HOST_ID);
  if (existing) {
    const panel = document.getElementById(PANEL_ID);
    const btn = document.getElementById(BTN_ID);
    if (panel && btn) applyOpen(panel, btn, readOpen());
    return;
  }

  const root = document.createElement("div");
  root.id = HOST_ID;
  root.style.cssText = `position:fixed;right:20px;bottom:20px;z-index:${LAYER};pointer-events:auto;`;

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.style.cssText = `position:absolute;right:0;bottom:60px;width:min(380px, calc(100vw - 32px));height:min(520px, calc(100vh - 96px));border:1px solid #222;border-radius:24px;background:#050505;overflow:hidden;z-index:${LAYER};`;

  const iframe = document.createElement("iframe");
  iframe.title = "Ask anything";
  iframe.name = "northgate-ask-frame";
  iframe.src = `/widget/${PUBLIC_ID}`;
  iframe.style.cssText =
    "width:100%;height:100%;border:0;background:#050505;pointer-events:auto;";
  panel.appendChild(iframe);

  const btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.type = "button";
  btn.setAttribute("aria-label", "Ask anything");
  btn.textContent = "Ask anything";
  btn.style.cssText =
    "position:relative;z-index:" +
    LAYER +
    ";pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;height:52px;min-width:52px;padding:0 28px;border:0;border-radius:9999px;background:#ffffff;color:#050505;font-family:inherit;font-size:14px;font-weight:600;letter-spacing:0.06em;cursor:pointer;appearance:none;-webkit-appearance:none;overflow:hidden;";

  applyOpen(panel, btn, readOpen());

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = btn.getAttribute("aria-expanded") !== "true";
    applyOpen(panel, btn, next);
  });

  root.addEventListener("mousedown", (e) => e.stopPropagation());
  root.addEventListener("pointerdown", (e) => e.stopPropagation());
  root.addEventListener("click", (e) => e.stopPropagation());
  panel.addEventListener("mousedown", (e) => e.stopPropagation());
  panel.addEventListener("pointerdown", (e) => e.stopPropagation());
  panel.addEventListener("click", (e) => e.stopPropagation());

  root.appendChild(panel);
  root.appendChild(btn);
  document.body.appendChild(root);
}

export function AskAnything() {
  useEffect(() => {
    ensureHost();
  }, []);
  return null;
}
