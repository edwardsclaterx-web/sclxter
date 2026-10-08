const BOOT = `(function(){
  var PUBLIC_ID='sclxter';
  var HOST_ID='sclxter-site-ask-host';
  var PANEL_ID='sclxter-site-ask-panel';
  var BTN_ID='sclxter-site-ask-btn';
  var HINT_ID='sclxter-site-ask-hint';
  var OPEN_KEY='sclxter:ask:'+PUBLIC_ID+':open';
  var LAYER=2147483000;
  function skipPath(){
    var p=location.pathname||'';
    return p.indexOf('/demo')===0||p.indexOf('/widget')===0||p.indexOf('/dashboard')===0;
  }
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
    btn.style.setProperty('border-radius','16px','important');
    try{ sessionStorage.setItem(OPEN_KEY, open?'1':'0'); }catch(e){}
  }
  function sync(){
    var host=document.getElementById(HOST_ID);
    if(host) host.style.display=skipPath()?'none':'';
    var demo=document.getElementById('northgate-ask-host');
    var onDemo=(location.pathname||'').indexOf('/demo')===0;
    if(demo) demo.style.display=onDemo?'':'none';
  }
  var HINT_HTML='<span style="font-size:11px;font-weight:600;letter-spacing:0.04em">AI assistant here</span><span aria-hidden="true" style="display:flex;flex-direction:column;align-items:center;line-height:0"><span style="width:1px;height:30px;background:#f4f4f4"></span><span style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #f4f4f4"></span></span>';
  var HINT_CSS='display:flex;flex-direction:column;align-items:center;gap:4px;margin-bottom:12px;pointer-events:none;color:#f4f4f4;font-family:inherit;';
  var HOST_CSS='position:fixed;right:20px;bottom:20px;z-index:'+LAYER+';pointer-events:auto;display:flex;flex-direction:column;align-items:flex-end;gap:0;';
  function paintHint(h){
    h.style.cssText=HINT_CSS;
    h.innerHTML=HINT_HTML;
  }
  function ensureHost(){
    var existing=document.getElementById(HOST_ID);
    if(existing){
      existing.style.cssText=HOST_CSS;
      var p=document.getElementById(PANEL_ID);
      var b=document.getElementById(BTN_ID);
      var h=document.getElementById(HINT_ID);
      if(p&&b) applyOpen(p,b,readOpen());
      if(p) p.style.bottom='144px';
      if(h) paintHint(h);
      sync();
      return;
    }
    if(skipPath()) return;
    var root=document.createElement('div');
    root.id=HOST_ID;
    root.style.cssText=HOST_CSS;
    var panel=document.createElement('div');
    panel.id=PANEL_ID;
    panel.style.cssText='position:absolute;right:0;bottom:144px;width:min(380px, calc(100vw - 32px));height:min(520px, calc(100vh - 176px));border:1px solid #222;border-radius:24px;background:#050505;overflow:hidden;z-index:'+LAYER+';';
    var iframe=document.createElement('iframe');
    iframe.title='Ask anything';
    iframe.name='sclxter-site-ask-frame';
    iframe.src='/widget/'+PUBLIC_ID;
    iframe.style.cssText='width:100%;height:100%;border:0;background:#050505;pointer-events:auto;';
    panel.appendChild(iframe);
    var hint=document.createElement('div');
    hint.id=HINT_ID;
    paintHint(hint);
    var btn=document.createElement('button');
    btn.id=BTN_ID;
    btn.type='button';
    btn.setAttribute('aria-label','Ask anything');
    btn.textContent='Ask anything';
    btn.style.cssText='position:relative;z-index:'+LAYER+';pointer-events:auto;display:inline-flex;align-items:center;justify-content:center;height:52px;min-width:52px;padding:0 28px;border:0;border-radius:16px;background:#ffffff;color:#050505;font-family:inherit;font-size:14px;font-weight:600;letter-spacing:0.06em;cursor:pointer;appearance:none;-webkit-appearance:none;overflow:hidden;';
    btn.style.setProperty('border-radius','16px','important');
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
    root.appendChild(panel);
    root.appendChild(hint);
    root.appendChild(btn);
    document.body.appendChild(root);
  }
  function onRoute(){
    if(!skipPath()) ensureHost();
    sync();
  }
  onRoute();
  window.addEventListener('popstate',onRoute);
  var push=history.pushState;
  history.pushState=function(){ push.apply(this,arguments); onRoute(); };
  var replace=history.replaceState;
  history.replaceState=function(){ replace.apply(this,arguments); onRoute(); };
})();`;

export function SiteAskAnything() {
  return <script dangerouslySetInnerHTML={{ __html: BOOT }} />;
}
