(function () {
  try {
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
    var pageOrigin = window.location.origin;
    var hostId = "sclxter-ask-host-" + id;
    if (document.getElementById(hostId)) return;

    function hex(v) {
      return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : "";
    }

    fetch(
      origin +
        "/api/widget/" +
        encodeURIComponent(id) +
        "?from=" +
        encodeURIComponent(pageOrigin),
      { cache: "no-store" },
    )
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        if (!d || d.live !== true) return;
        if (document.getElementById(hostId)) return;
        var t = d.theme || (d.appearance && d.appearance.theme) || {};
        var outline = hex(t.outline);
        var primary = hex(t.primary);
        var text = hex(t.text);
        if (!outline || !primary || !text) return;
        mount({ outline: outline, primary: primary, text: text });
      })
      .catch(function () {});

    function mount(theme) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Ask anything");
      btn.textContent = "Ask anything";
      btn.className = "sclxter-ask-btn";
      btn.style.cssText =
        "position:fixed;right:20px;bottom:20px;z-index:2147483000;display:inline-flex;align-items:center;justify-content:center;height:52px;min-width:52px;padding:0 28px;box-sizing:border-box;border:2px solid " +
        theme.outline +
        ";border-radius:20px;background:" +
        theme.primary +
        ";background-clip:padding-box;color:" +
        theme.text +
        ";font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.06em;cursor:pointer;appearance:none;-webkit-appearance:none;overflow:visible;";
      btn.style.setProperty("border-radius", "20px", "important");

      var frameWrap = document.createElement("div");
      frameWrap.id = hostId + "-panel";
      frameWrap.className = "sclxter-ask-panel";
      frameWrap.style.cssText =
        "position:fixed;right:20px;bottom:84px;z-index:2147483000;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 120px));max-width:calc(100vw - 24px);border:0;background:transparent;overflow:visible;";

      var iframe = document.createElement("iframe");
      iframe.title = "Ask anything";
      iframe.name = "sclxter-ask-frame-" + id;
      iframe.setAttribute("allowtransparency", "true");
      iframe.style.cssText =
        "width:100%;height:100%;border:0;background:" +
        theme.primary +
        ";color-scheme:normal;opacity:1;";
      iframe.src =
        origin +
        "/widget/" +
        encodeURIComponent(id) +
        "?from=" +
        encodeURIComponent(pageOrigin) +
        "&outline=" +
        encodeURIComponent(theme.outline) +
        "&primary=" +
        encodeURIComponent(theme.primary) +
        "&text=" +
        encodeURIComponent(theme.text);

      var openKey = "sclxter:ask:" + id + ":open";
      function readOpen() {
        try {
          return sessionStorage.getItem(openKey) === "1";
        } catch (e) {
          return false;
        }
      }

      function placeLauncher() {
        var mobile = window.matchMedia("(max-width: 767px)").matches;
        var safe = "max(12px, env(safe-area-inset-bottom, 0px))";
        if (mobile) {
          btn.style.left = "auto";
          btn.style.right = "12px";
          btn.style.bottom = safe;
          frameWrap.style.left = "12px";
          frameWrap.style.right = "12px";
          frameWrap.style.width = "auto";
          frameWrap.style.maxWidth = "none";
          frameWrap.style.bottom = "calc(" + safe + " + 64px)";
          frameWrap.style.height =
            "min(560px, calc(100dvh - 92px - env(safe-area-inset-bottom, 0px)))";
        } else {
          btn.style.left = "";
          btn.style.right = "20px";
          btn.style.bottom = "20px";
          frameWrap.style.left = "";
          frameWrap.style.right = "20px";
          frameWrap.style.width = "min(380px,calc(100vw - 32px))";
          frameWrap.style.maxWidth = "calc(100vw - 24px)";
          frameWrap.style.bottom = "84px";
          frameWrap.style.height = "min(560px,calc(100vh - 120px))";
        }
      }

      function applyOpen(open) {
        placeLauncher();
        frameWrap.style.visibility = open ? "visible" : "hidden";
        frameWrap.style.opacity = open ? "1" : "0";
        frameWrap.style.pointerEvents = open ? "auto" : "none";
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.textContent = open ? "Minimise" : "Ask anything";
        btn.setAttribute("aria-label", open ? "Minimise" : "Ask anything");
        btn.style.setProperty("border-radius", "20px", "important");
        try {
          sessionStorage.setItem(openKey, open ? "1" : "0");
        } catch (e) {}
      }

      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        applyOpen(btn.getAttribute("aria-expanded") !== "true");
      });

      var host = document.createElement("div");
      host.id = hostId;
      host.className = "sclxter-ask-host";
      host.addEventListener("mousedown", function (e) {
        e.stopPropagation();
      });
      host.addEventListener("click", function (e) {
        e.stopPropagation();
      });

      var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
      var reset = document.createElement("style");
      reset.textContent =
        ":host{all:initial}*,*::before,*::after{box-sizing:border-box}";
      root.appendChild(reset);
      frameWrap.appendChild(iframe);
      root.appendChild(frameWrap);
      root.appendChild(btn);
      document.body.appendChild(host);
      applyOpen(readOpen());
      window.addEventListener("resize", function () {
        applyOpen(btn.getAttribute("aria-expanded") === "true");
      });
    }
  } catch (e) {}
})();
