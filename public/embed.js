(function () {
  var script = document.currentScript;
  if (!script) return;
  var id = script.getAttribute("data-id");
  if (!id) return;
  var origin = new URL(script.src).origin;

  if (!document.getElementById("sclxter-inter")) {
    var font = document.createElement("link");
    font.id = "sclxter-inter";
    font.rel = "stylesheet";
    font.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(font);
  }

  fetch(origin + "/api/widget/" + encodeURIComponent(id)).catch(function () {});

  var btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Ask anything");
  btn.textContent = "Ask anything";
  btn.style.cssText =
    "position:fixed;right:0;bottom:28%;z-index:2147483000;margin:0;padding:18px 10px;border:1px solid #222;border-right:0;background:#ffffff;color:#050505;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:12px;font-weight:500;letter-spacing:0.14em;line-height:1.2;cursor:pointer;writing-mode:vertical-rl;text-orientation:mixed;transform:rotate(180deg);";

  var frameWrap = document.createElement("div");
  frameWrap.style.cssText =
    "display:none;position:fixed;right:48px;bottom:20px;z-index:2147483000;width:min(380px,calc(100vw - 64px));height:min(560px,calc(100vh - 40px));border:1px solid #222;background:#050505;";
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
