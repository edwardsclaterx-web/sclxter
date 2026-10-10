(function () {
  function findScript() {
    if (document.currentScript) return document.currentScript;
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].getAttribute("src") || "";
      if (src.indexOf("embed.js") !== -1) return scripts[i];
    }
    return null;
  }

  var script = findScript();
  if (!script) return;
  var id = script.getAttribute("data-id");
  if (!id) return;
  var origin = new URL(script.src, window.location.href).origin;
  var hostId = "sclxter-ask-host-" + id;
  if (document.getElementById(hostId)) return;

  var theme = { outline: "#222222", primary: "#ffffff", text: "#000000" };

  var btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Ask anything");
  btn.textContent = "Ask anything";

  var frameWrap = document.createElement("div");
  frameWrap.id = hostId + "-panel";
  var iframe = document.createElement("iframe");
  iframe.title = "Ask anything";
  iframe.name = "sclxter-ask-frame-" + id;
  iframe.src = origin + "/widget/" + encodeURIComponent(id);

  function paintTheme() {
    btn.style.cssText =
      "position:fixed;right:20px;bottom:20px;z-index:2147483000;display:inline-flex;align-items:center;justify-content:center;height:52px;min-width:52px;padding:0 28px;border:1px solid " +
      theme.outline +
      ";border-radius:16px;background:" +
      theme.primary +
      ";color:" +
      theme.text +
      ";font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.06em;cursor:pointer;appearance:none;-webkit-appearance:none;overflow:hidden;";
    btn.style.setProperty("border-radius", "16px", "important");
    frameWrap.style.cssText =
      "position:fixed;right:20px;bottom:84px;z-index:2147483000;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 120px));border:1px solid " +
      theme.outline +
      ";border-radius:24px;background:" +
      theme.primary +
      ";overflow:hidden;";
    iframe.style.cssText =
      "width:100%;height:100%;border:0;background:" + theme.primary + ";";
  }

  paintTheme();

  fetch(origin + "/api/widget/" + encodeURIComponent(id))
    .then(function (r) {
      return r.json();
    })
    .then(function (d) {
      var t = (d && d.theme) || (d && d.appearance && d.appearance.theme);
      if (!t) return;
      if (t.outline) theme.outline = t.outline;
      if (t.primary) theme.primary = t.primary;
      if (t.text) theme.text = t.text;
      paintTheme();
    })
    .catch(function () {});

  var openKey = "sclxter:ask:" + id + ":open";
  function readOpen() {
    try {
      return sessionStorage.getItem(openKey) === "1";
    } catch (e) {
      return false;
    }
  }

  function applyOpen(open) {
    frameWrap.style.visibility = open ? "visible" : "hidden";
    frameWrap.style.opacity = open ? "1" : "0";
    frameWrap.style.pointerEvents = open ? "auto" : "none";
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? "Minimise" : "Ask anything";
    btn.setAttribute("aria-label", open ? "Minimise" : "Ask anything");
    btn.style.setProperty("border-radius", "16px", "important");
    try {
      sessionStorage.setItem(openKey, open ? "1" : "0");
    } catch (e) {}
  }

  applyOpen(readOpen());

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    applyOpen(btn.getAttribute("aria-expanded") !== "true");
  });

  frameWrap.appendChild(iframe);
  var host = document.createElement("div");
  host.id = hostId;
  host.addEventListener("mousedown", function (e) {
    e.stopPropagation();
  });
  host.addEventListener("click", function (e) {
    e.stopPropagation();
  });
  host.appendChild(frameWrap);
  host.appendChild(btn);
  document.body.appendChild(host);
})();
