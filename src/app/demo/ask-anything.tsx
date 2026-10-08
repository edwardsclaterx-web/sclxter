const PUBLIC_ID = "northgate";
const LAYER = 2147483000;

export function AskAnything() {
  return (
    <>
      <div
        id="northgate-ask-anything"
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: LAYER,
          pointerEvents: "auto",
        }}
      >
        <div
          id="northgate-ask-panel"
          hidden
          style={{
            position: "absolute",
            right: 0,
            bottom: 52,
            width: "min(380px, calc(100vw - 32px))",
            height: "min(520px, calc(100vh - 96px))",
            border: "1px solid #222",
            background: "#050505",
            pointerEvents: "auto",
            overflow: "hidden",
            zIndex: LAYER,
          }}
        >
          <iframe
            title="Ask anything"
            src={`/widget/${PUBLIC_ID}`}
            style={{
              width: "100%",
              height: "100%",
              border: 0,
              background: "#050505",
              pointerEvents: "auto",
            }}
          />
        </div>
        <button
          id="northgate-ask-btn"
          type="button"
          aria-label="Ask anything"
          aria-expanded="false"
          style={{
            position: "relative",
            zIndex: LAYER,
            pointerEvents: "auto",
            height: 44,
            padding: "0 20px",
            border: 0,
            background: "#ffffff",
            color: "#050505",
            fontFamily: "inherit",
            fontSize: 14,
            letterSpacing: "0.06em",
            cursor: "pointer",
          }}
        >
          Ask anything
        </button>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
  var btn=document.getElementById('northgate-ask-btn');
  var panel=document.getElementById('northgate-ask-panel');
  if(!btn||!panel||btn.dataset.bound) return;
  btn.dataset.bound='1';
  fetch('/api/widget/${PUBLIC_ID}').catch(function(){});
  btn.addEventListener('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    var open=panel.getAttribute('hidden')===null;
    if(open){ panel.setAttribute('hidden',''); btn.setAttribute('aria-expanded','false'); }
    else { panel.removeAttribute('hidden'); btn.setAttribute('aria-expanded','true'); }
  }, true);
})();`,
        }}
      />
    </>
  );
}
