"use client";

import { useEffect } from "react";

export function WidgetForm({
  publicId,
  welcome,
  assistantName,
}: {
  publicId: string;
  welcome: string;
  assistantName: string;
}) {
  const endpoint =
    publicId === "sclxter"
      ? "/api/chat?site=sclxter"
      : `/api/chat?publicId=${encodeURIComponent(publicId)}`;
  const boot = `(function(){
  var form=document.getElementById('wa-form');
  var input=document.getElementById('wa-input');
  var send=document.getElementById('wa-send');
  var log=document.getElementById('wa-log');
  var welcome=document.getElementById('wa-welcome');
  var clear=document.getElementById('wa-clear');
  if(!form||!input||!send||!log) return;
  var publicId=${JSON.stringify(publicId)};
  var msgKey='sclxter:ask:'+publicId+':messages';
  var draftKey='sclxter:ask:'+publicId+':draft';
  if(form.dataset.bound==='1') return;
  form.dataset.bound='1';
  var name=${JSON.stringify(assistantName)};
  var endpoint=${JSON.stringify(endpoint)};
  var history=[];
  var busy=false;
  function load(){
    try{
      var raw=sessionStorage.getItem(msgKey);
      if(!raw) return [];
      var parsed=JSON.parse(raw);
      return Array.isArray(parsed)?parsed.filter(function(m){
        return m&&(m.role==='user'||m.role==='assistant')&&typeof m.content==='string';
      }):[];
    }catch(e){ return []; }
  }
  function save(){
    try{ sessionStorage.setItem(msgKey, JSON.stringify(history)); }catch(e){}
  }
  function bubble(role,text){
    var wrap=document.createElement('div');
    if(role==='user') wrap.style.textAlign='right';
    var who=document.createElement('p');
    who.className='mb-1 text-[10px] uppercase tracking-[0.16em] text-muted';
    who.textContent=role==='user'?'You':name;
    var body=document.createElement('p');
    body.className=role==='user'
      ? 'inline-block max-w-[90%] whitespace-pre-wrap px-3 py-2 text-sm leading-6 bg-fg text-bg'
      : 'inline-block max-w-[90%] whitespace-pre-wrap px-3 py-2 text-sm leading-6 border border-line bg-surface';
    body.textContent=text;
    wrap.appendChild(who); wrap.appendChild(body);
    if(welcome) welcome.style.display='none';
    log.appendChild(wrap);
    log.scrollTop=log.scrollHeight;
  }
  history=load();
  history.forEach(function(m){ bubble(m.role,m.content); });
  try{ input.value=sessionStorage.getItem(draftKey)||''; }catch(e){}
  function go(){
    var v=(input.value||'').trim();
    if(!v||busy) return;
    input.value='';
    try{ sessionStorage.setItem(draftKey,''); }catch(e){}
    history.push({role:'user', content:v});
    save();
    bubble('user', v);
    busy=true; send.textContent='…';
    send.removeAttribute('disabled');
    fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:history})})
      .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});})
      .then(function(x){
        var reply=(x.d&&x.d.reply)||(x.d&&x.d.error)||'The assistant is unavailable.';
        history.push({role:'assistant', content:reply});
        save();
        bubble('assistant', reply);
      })
      .catch(function(){ bubble('assistant','Could not reach the assistant.'); })
      .then(function(){ busy=false; send.textContent='Send'; send.removeAttribute('disabled'); });
  }
  form.addEventListener('submit', function(e){ e.preventDefault(); e.stopPropagation(); go(); });
  send.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); go(); });
  input.addEventListener('input', function(){
    send.removeAttribute('disabled');
    try{ sessionStorage.setItem(draftKey, input.value); }catch(e){}
  });
  function stop(e){ e.stopPropagation(); }
  form.addEventListener('mousedown', stop);
  form.addEventListener('pointerdown', stop);
  form.addEventListener('click', stop);
  input.addEventListener('mousedown', stop);
  input.addEventListener('pointerdown', stop);
  clear&&clear.addEventListener('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    history=[];
    save();
    try{ sessionStorage.removeItem(draftKey); }catch(e2){}
    log.querySelectorAll('div').forEach(function(n){n.remove();});
    if(welcome) welcome.style.display='';
    input.value='';
    busy=false; send.removeAttribute('disabled'); send.textContent='Send';
  });
})();`;

  useEffect(() => {
    new Function(boot)();
  }, [boot]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-line pb-3">
        <p className="text-xs tracking-[0.16em]">Ask anything</p>
        <button
          id="wa-clear"
          type="button"
          className="text-xs text-muted hover:text-fg"
        >
          Clear chat
        </button>
      </div>
      <div id="wa-log" className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <p id="wa-welcome" className="text-sm leading-6 text-muted">
          {welcome}
        </p>
      </div>
      <form
        id="wa-form"
        className="mt-4 flex items-start gap-2 border-t border-line pt-4 pb-1"
      >
        <div className="min-w-0 flex-1">
          <input
            id="wa-input"
            name="message"
            className="h-10 w-full border border-line bg-surface px-3 text-sm text-fg outline-none placeholder:text-muted focus:border-fg"
            placeholder="Ask anything"
            aria-label="Ask anything"
            autoComplete="off"
          />
          <p className="mt-1.5 text-[10px] leading-4 tracking-wide text-muted opacity-45">
            powered by sclxter.com
          </p>
        </div>
        <button
          id="wa-send"
          type="submit"
          style={{
            display: "inline-flex",
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
            border: 0,
            borderRadius: 9999,
            background: "#ffffff",
            color: "#050505",
            fontSize: 14,
            letterSpacing: "0.04em",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            opacity: 1,
            pointerEvents: "auto",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
