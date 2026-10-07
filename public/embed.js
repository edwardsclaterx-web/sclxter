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
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap";
    document.head.appendChild(font);
  }

  fetch(origin + "/api/widget/" + encodeURIComponent(id)).catch(function () {});

  var colour = "#ffffff";
  var btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Open shop assistant");
  btn.textContent = "Ask";
  btn.style.cssText =
    "position:fixed;right:20px;bottom:20px;z-index:2147483000;height:44px;padding:0 18px;border:0;background:" +
    colour +
    ";color:#050505;font-family:Inter,ui-sans-serif,system-ui,sans-serif;font-size:13px;letter-spacing:0.12em;cursor:pointer;";

  var frameWrap = document.createElement("div");
  frameWrap.style.cssText =
    "display:none;position:fixed;right:20px;bottom:76px;z-index:2147483000;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 120px));border:1px solid #222;background:#050505;box-shadow:none;";
  var iframe = document.createElement("iframe");
  iframe.title = "Shop assistant";
  iframe.src = origin + "/widget/" + encodeURIComponent(id);
  iframe.style.cssText = "width:100%;height:100%;border:0;background:#050505;";
  frameWrap.appendChild(iframe);

  btn.addEventListener("click", function () {
    var open = frameWrap.style.display === "block";
    frameWrap.style.display = open ? "none" : "block";
  });

  document.body.appendChild(frameWrap);
  document.body.appendChild(btn);
})();
