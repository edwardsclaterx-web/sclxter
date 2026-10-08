export function WidgetForm({
  publicId,
  welcome,
  assistantName,
}: {
  publicId: string;
  welcome: string;
  assistantName: string;
}) {
  const endpoint = `/api/chat?publicId=${encodeURIComponent(publicId)}`;
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
      <form id="wa-form" className="mt-4 flex gap-2 border-t border-line pt-4">
        <input
          id="wa-input"
          name="message"
          className="h-10 w-full border border-line bg-surface px-3 text-sm text-fg outline-none placeholder:text-muted focus:border-fg"
          placeholder="Ask anything"
          aria-label="Ask anything"
          autoComplete="off"
        />
        <button
          id="wa-send"
          type="submit"
          className="inline-flex h-10 items-center justify-center bg-accent px-4 text-sm tracking-wide text-accent-fg"
        >
          Send
        </button>
      </form>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
  var form=document.getElementById('wa-form');
  var input=document.getElementById('wa-input');
  var send=document.getElementById('wa-send');
  var log=document.getElementById('wa-log');
  var welcome=document.getElementById('wa-welcome');
  var clear=document.getElementById('wa-clear');
  if(!form||!input||!send||!log||form.dataset.bound) return;
  form.dataset.bound='1';
  var history=[];
  var busy=false;
  var name=${JSON.stringify(assistantName)};
  var endpoint=${JSON.stringify(endpoint)};
  function bubble(role, text){
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
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var v=(input.value||'').trim();
    if(!v||busy) return;
    input.value='';
    history.push({role:'user', content:v});
    bubble('user', v);
    busy=true; send.textContent='…';
    fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:history})})
      .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});})
      .then(function(x){
        var reply=(x.d&&x.d.reply)||(x.d&&x.d.error)||'The assistant is unavailable.';
        history.push({role:'assistant', content:reply});
        bubble('assistant', reply);
      })
      .catch(function(){ bubble('assistant','Could not reach the assistant.'); })
      .then(function(){ busy=false; send.textContent='Send'; send.disabled=false; });
  });
  clear&&clear.addEventListener('click', function(){
    history=[];
    log.querySelectorAll('div').forEach(function(n){n.remove();});
    if(welcome) welcome.style.display='';
    input.value='';
    busy=false; send.disabled=false; send.textContent='Send';
  });
})();`,
        }}
      />
    </div>
  );
}
