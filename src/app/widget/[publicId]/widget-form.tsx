"use client";

import { useEffect } from "react";
import { CLARIFY } from "@/lib/chat-copy";
import type { WidgetTheme } from "@/lib/types";

export function WidgetForm({
  publicId,
  welcome,
  assistantName,
  theme,
  from,
  endpoint: endpointOverride,
  extraBody,
  namespace,
  blocked,
}: {
  publicId: string;
  welcome: string;
  assistantName: string;
  theme?: WidgetTheme;
  from?: string | null;
  endpoint?: string;
  extraBody?: Record<string, unknown>;
  namespace?: string;
  blocked?: string | null;
}) {
  const fromQ = from ? `&from=${encodeURIComponent(from)}` : "";
  const endpoint =
    endpointOverride ||
    (publicId === "sclxter"
      ? `/api/chat?site=sclxter${fromQ}`
      : `/api/chat?publicId=${encodeURIComponent(publicId)}${fromQ}`);
  const boot = `(function(){
  var form=document.getElementById('wa-form');
  var input=document.getElementById('wa-input');
  var send=document.getElementById('wa-send');
  var log=document.getElementById('wa-log');
  var welcome=document.getElementById('wa-welcome');
  var clear=document.getElementById('wa-clear');
  if(!form||!input||!send||!log) return;
  var publicId=${JSON.stringify(namespace || publicId)};
  var extra=${JSON.stringify(extraBody || {})};
  var blocked=${JSON.stringify(blocked || "")};
  var msgKey='sclxter:ask:'+publicId+':messages';
  var draftKey='sclxter:ask:'+publicId+':draft';
  var cidKey='sclxter:ask:'+publicId+':cid';
  var conversationId='';
  try{ conversationId=sessionStorage.getItem(cidKey)||''; }catch(e){}
  if(form.dataset.bound==='1') return;
  form.dataset.bound='1';
  var name=${JSON.stringify(assistantName)};
  var endpoint=${JSON.stringify(endpoint)};
  var theme=${JSON.stringify(theme || null)};
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
    body.className='inline-block max-w-[90%] whitespace-pre-wrap px-3 py-2 text-sm leading-6';
    if(theme){
      if(role==='user'){
        body.style.background=theme.text;
        body.style.color=theme.primary;
      }else{
        body.style.border='1px solid '+theme.outline;
        body.style.color=theme.text;
      }
    }else{
      body.className=role==='user'
        ? 'inline-block max-w-[90%] whitespace-pre-wrap px-3 py-2 text-sm leading-6 bg-fg text-bg'
        : 'inline-block max-w-[90%] whitespace-pre-wrap px-3 py-2 text-sm leading-6 border border-line bg-surface';
    }
    body.textContent=text;
    wrap.appendChild(who); wrap.appendChild(body);
    if(welcome) welcome.style.display='none';
    log.appendChild(wrap);
    if(role==='assistant' && wrap.offsetHeight > log.clientHeight){
      log.scrollTop=wrap.offsetTop;
    }else{
      log.scrollTop=log.scrollHeight;
    }
  }
  history=load();
  history.forEach(function(m){ bubble(m.role,m.content); });
  try{ input.value=sessionStorage.getItem(draftKey)||''; }catch(e){}
  function go(){
    if(blocked) return;
    var v=(input.value||'').trim();
    if(!v||busy) return;
    input.value='';
    try{ sessionStorage.setItem(draftKey,''); }catch(e){}
    history.push({role:'user', content:v});
    save();
    bubble('user', v);
    busy=true; send.textContent='…';
    send.removeAttribute('disabled');
    fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.assign({messages:history,conversationId:conversationId||undefined},extra))})
      .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});})
      .then(function(x){
        if(x.d&&x.d.conversationId){
          conversationId=x.d.conversationId;
          try{ sessionStorage.setItem(cidKey, conversationId); }catch(e3){}
        }
        var reply;
        var clarify=${JSON.stringify(CLARIFY)};
        if(!x.ok){
          var code=x.d&&x.d.error;
          reply=code&&(code.indexOf('unavailable')!==-1||code.indexOf('not available')!==-1)
            ? code
            : (x.d&&x.d.reply)||clarify;
        }else{
          reply=(x.d&&x.d.reply)||clarify;
        }
        history.push({role:'assistant', content:reply});
        save();
        bubble('assistant', reply);
      })
      .catch(function(){ bubble('assistant',${JSON.stringify(CLARIFY)}); })
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
    conversationId='';
    save();
    try{ sessionStorage.removeItem(draftKey); sessionStorage.removeItem(cidKey); }catch(e2){}
    log.querySelectorAll('div').forEach(function(n){n.remove();});
    if(welcome) welcome.style.display='';
    input.value='';
    busy=false; send.removeAttribute('disabled'); send.textContent='Send';
  });
})();`;

  useEffect(() => {
    new Function(boot)();
  }, [boot]);

  const line = theme?.outline;
  const ink = theme?.text;

  return (
    <div className="flex h-full flex-col" style={ink ? { color: ink } : undefined}>
      <div
        className={`mb-3 flex items-center justify-between gap-3 border-b pb-3 ${theme ? "" : "border-line"}`}
        style={line ? { borderColor: line } : undefined}
      >
        <p className="text-xs tracking-[0.16em]">Ask anything</p>
        <button
          id="wa-clear"
          type="button"
          className={`text-xs ${theme ? "opacity-70 hover:opacity-100" : "text-muted hover:text-fg"}`}
        >
          Clear chat
        </button>
      </div>
      <div id="wa-log" className="ask-log min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
        <p
          id="wa-welcome"
          className={`text-sm leading-6 ${theme ? "opacity-70" : "text-muted"}`}
        >
          {welcome}
        </p>
      </div>
      <form
        id="wa-form"
        className={`mt-4 flex items-start gap-2 border-t pt-4 pb-1 ${theme ? "" : "border-line"}`}
        style={line ? { borderColor: line } : undefined}
      >
        <div className="min-w-0 flex-1">
          <input
            id="wa-input"
            name="message"
            className={
              theme
                ? "h-10 w-full border px-3 text-[16px] outline-none"
                : "h-10 w-full border border-line bg-surface px-3 text-[16px] text-fg outline-none placeholder:text-muted focus:border-fg"
            }
            style={
              theme
                ? {
                    borderColor: theme.outline,
                    background: theme.primary,
                    color: theme.text,
                  }
                : undefined
            }
            placeholder="Ask anything"
            aria-label="Ask anything"
            autoComplete="off"
            disabled={Boolean(blocked)}
          />
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
            border: theme ? `1px solid ${theme.outline}` : 0,
            borderRadius: 20,
            background: theme ? theme.primary : "#ffffff",
            color: theme ? theme.text : "#050505",
            fontSize: 14,
            letterSpacing: "0.04em",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            pointerEvents: blocked ? "none" : "auto",
            opacity: blocked ? 0.4 : 1,
          }}
          disabled={Boolean(blocked)}
        >
          Send
        </button>
      </form>
      <p className="mt-2 text-center text-[10px] leading-4 tracking-wide text-muted opacity-45">
        powered by sclxter.com
      </p>
    </div>
  );
}
