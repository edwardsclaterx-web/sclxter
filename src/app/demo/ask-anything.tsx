const PUBLIC_ID = "northgate";

const BOOT = `(function(){
  var PUBLIC_ID=${JSON.stringify(PUBLIC_ID)};
  var HOST_ID='northgate-ask-host';
  var PANEL_ID='northgate-ask-panel';
  var BTN_ID='northgate-ask-btn';
  var OPEN_KEY='sclxter:ask:'+PUBLIC_ID+':open';
  var LAYER=2147483000;
  function readOpen(){
    try{ return sessionStorage.getItem(OPEN_KEY)==='1'; }catch(e){ return false; }
  }
  function applyOpen(panel,btn,open){
    panel.style.visibility=open?'visible':'hidden';
    panel.style.opacity=open?'1':'0';
    panel.style.pointerEvents=open?'auto':'none';
    btn.setAttribute('aria-expanded',open?'true':'false');
    btn.textContent=open?'Minimise':'Ask anything';
    btn.setAttribute('aria-label',open?'Minimise':'Ask anything');
    btn.style.setProperty('border-radius','10px','important');
    try{ sessionStorage.setItem(OPEN_KEY, open?'1':'0'); }catch(e){}
  }
  var existing=document.getElementById(HOST_ID);
  if(existing){
    var p=document.getElementById(PANEL_ID);
    var b=document.getElementById(BTN_ID);
    if(p&&b) applyOpen(p,b,readOpen());
    return;
  }
  var root=document.createElement('div');
  root.id=HOST_ID;
  root.style.cssText='position:fixed;right:20px;bottom:20px;z-index:'+LAYER+';pointer-events:auto;';
  var panel=document.createElement('div');
  panel.id=PANEL_ID;
  panel.style.cssText='position:absolute;right:0;bottom:60px;width:min(380px, calc(100vw - 32px));height:min(520px, calc(100vh - 96px));border:1px solid #222;border-radius:24px;background:#050505;overflow:hidden;z-index:'+LAYER+';';
  var iframe=document.createElement('iframe');
  iframe.title='Ask anything';
  iframe.name='northgate-ask-frame';
  iframe.src='/widget/'+PUBLIC_ID;
  iframe.style.cssText='width:100%;height:100%;border:0;background:#050505;pointer-events:auto;';
  panel.appendChild(iframe);
  var btn=document.createElement('button');
  btn.id=BTN_ID;
  btn.type='button';
  btn.setAttribute('aria-label','Ask anything');
  btn.textContent='Ask anything';
  btn.style.cssText='position:relative;z-index:'+LAYER+';pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;height:52px;min-width:52px;padding:0 28px;border:0;border-radius:10px;background:#ffffff;color:#050505;font-family:inherit;font-size:14px;font-weight:600;letter-spacing:0.06em;cursor:pointer;appearance:none;-webkit-appearance:none;overflow:hidden;';
  btn.style.setProperty('border-radius','10px','important');
  applyOpen(panel,btn,readOpen());
  btn.addEventListener('click',function(e){
    e.preventDefault();
    e.stopPropagation();
    applyOpen(panel,btn,btn.getAttribute('aria-expanded')!=='true');
  });
  function stop(e){ e.stopPropagation(); }
  root.addEventListener('mousedown',stop);
  root.addEventListener('pointerdown',stop);
  root.addEventListener('click',stop);
  panel.addEventListener('mousedown',stop);
  panel.addEventListener('pointerdown',stop);
  panel.addEventListener('click',stop);
  root.appendChild(panel);
  root.appendChild(btn);
  document.body.appendChild(root);
})();`;

export function AskAnything() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: BOOT }}
    />
  );
}
