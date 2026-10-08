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

  fetch(origin + "/api/widget/" + encodeURIComponent(id)).catch(function () {});

  var btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Ask anything");
  btn.textContent = "Ask anything";
  btn.style.cssText =
    "position:fixed;right:20px;bottom:20px;z-index:2147483000;height:44px;padding:0 22px;border:0;border-radius:9999px;background:#ffffff;color:#050505;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:14px;letter-spacing:0.06em;cursor:pointer;";

  var frameWrap = document.createElement("div");
  frameWrap.style.cssText =
    "display:none;position:fixed;right:20px;bottom:76px;z-index:2147483000;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 120px));border:1px solid #222;background:#050505;";
  var iframe = document.createElement("iframe");
  iframe.title = "Ask anything";
  iframe.src = origin + "/widget/" + encodeURIComponent(id);
  iframe.style.cssText = "width:100%;height:100%;border:0;background:#050505;";
  frameWrap.appendChild(iframe);

  btn.addEventListener("click", function () {
    var open = frameWrap.style.display === "block";
    frameWrap.style.display = open ? "none" : "block";
    btn.setAttribute("aria-expanded", open ? "false" : "true");
  });

  document.body.appendChild(frameWrap);
  document.body.appendChild(btn);
})();
