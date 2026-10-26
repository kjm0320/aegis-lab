// Lightweight DOM adapter for event-handler integration checks. This is not a browser renderer.
class Node {
 constructor(doc,tag='div',attrs={}){this.doc=doc;this.tagName=tag.toUpperCase();this.attrs={...attrs};this.id=attrs.id||'';this.dataset={};for(const [k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;this.value=attrs.value||'';this.checked=false;this.hidden=false;this.open=false;this.style={};this.events={};this._html='';this.textContent='';const cls=new Set((attrs.class||'').split(' '));this.classList={contains:k=>cls.has(k),toggle:(k,on)=>{if(on??!cls.has(k))cls.add(k);else cls.delete(k)},add:k=>cls.add(k),remove:k=>cls.delete(k)};}
 set innerHTML(v){this._html=v;this.doc.parse(v);}get innerHTML(){return this._html;}
 setAttribute(k,v){this.attrs[k]=String(v)}removeAttribute(k){delete this.attrs[k]}hasAttribute(k){return k in this.attrs}
 matches(selector){if(selector.startsWith('['))return this.hasAttribute(selector.slice(1,-1));if(selector.startsWith('.'))return this.classList.contains(selector.slice(1));return this.tagName.toLowerCase()===selector;}
 closest(s){return this.matches(s)?this:null}focus(){this.doc.activeElement=this}setSelectionRange(a,b){this.selectionStart=a;this.selectionEnd=b}scrollIntoView(){}after(n){this.doc.nodes.push(n)}append(n){this.doc.nodes.push(n)}remove(){}
 showModal(){this.open=true}close(){this.open=false}addEventListener(k,fn){(this.events[k]??=[]).push(fn)}
 click(){if(this.tagName==='A'){this.doc.downloads.push(this.download);return}return this.doc.dispatch('click',this)}
 reportValidity(){return Boolean(this.doc.getElementById('manual-target').value.trim())&&this.doc.nodes.filter(n=>/^draft-\d+-title$/.test(n.id)).every(n=>n.value.trim());}reset(){this.value=''}
}
export class TestDocument {
 constructor(html){this.nodes=[];this.ids=new Map();this.events={};this.activeElement=null;this.downloads=[];this.body=new Node(this,'body');this.parse(html);}
 parse(html){for(const m of html.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*?)>/g)){const attrs={};for(const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[a[1]]=a[2]??'';const n=new Node(this,m[1],attrs);this.nodes.push(n);if(n.id){const old=this.ids.get(n.id);if(old)this.nodes=this.nodes.filter(x=>x!==old);this.ids.set(n.id,n);}}}
 getElementById(id){const n=this.ids.get(id);if(!n)throw new Error('Missing DOM ID: '+id);return n}
 querySelectorAll(s){return this.nodes.filter(n=>n.matches(s))}querySelector(s){return this.querySelectorAll(s)[0]||null}
 createElement(t){return new Node(this,t)}addEventListener(k,fn){(this.events[k]??=[]).push(fn)}
 dispatch(type,target){for(const fn of this.events[type]||[])fn({target,preventDefault(){}})}
 async nodeEvent(type,target){for(const fn of target.events[type]||[])await fn({target,preventDefault(){}})}
}
