export function el(tag,attrs={},...children){const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(v==null||v===false)continue;if(k==='class')n.className=v;else if(k==='text')n.textContent=v;else if(k.startsWith('on'))n.addEventListener(k.slice(2).toLowerCase(),v);else if(k==='checked')n.checked=v;else if(k==='value')n.value=v;else n.setAttribute(k,v===true?'':String(v));}for(const c of children.flat(Infinity)){if(c!=null)n.append(c instanceof Node?c:document.createTextNode(String(c)));}return n;}
let toastTimer;
export function toast(message){const n=document.getElementById('toast');n.textContent=message;n.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.hidden=true,4000);}
export function status(n,message,error=false){n.textContent=message;n.classList.toggle('error',error);n.hidden=!message;}
export function sourceLink(url,text){const u=new URL(url);if(u.protocol!=='https:')throw new Error('Unsafe source URL');return el('a',{href:u.href,target:'_blank',rel:'noopener noreferrer'},text);}
export function field(label,id,control){return el('div',{class:'field'},el('label',{for:id},label),control);}
