const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const root = require('node:path').join(__dirname, '..');
const source = fs.readFileSync(root+'/public/assets/window-panels.js','utf8');
const pages = {'index.html':2, 'services/index.html':2, 'portfolio/index.html':3, 'about/index.html':1, 'contact/index.html':1};
for(const [p,count] of Object.entries(pages)) {
  const html = fs.readFileSync(root+'/public/'+p,'utf8');
  assert.equal([...html.matchAll(/data-window-panel=/g)].length,count);
  assert.equal([...html.matchAll(/class="lights" aria-hidden="true"/g)].length,count);
  assert(!html.includes('window-panel-button'));
  assert(html.includes('/assets/window-panels.js?v=4') && html.includes('/assets/window-panels.css?v=1'));
}
let active;
class E {
  constructor(tag='div') { this.tagName=tag.toUpperCase(); this.children=[]; this.dataset={}; this.style={}; this.attrs={}; this.events={}; this.id=''; }
  get firstElementChild(){ return this.children[0]; }
  append(...items) { for(const item of items) { item.remove(); item.parent=this; this.children.push(item); } }
  remove() { if(this.parent) { this.parent.children.splice(this.parent.children.indexOf(this),1); this.parent=null; } }
  before(...items) { const parent=this.parent; for(const item of items){ item.remove(); item.parent=parent; parent.children.splice(parent.children.indexOf(this),0,item); } }
  replaceWith(...items) { this.before(...items); this.remove(); }
  contains(target) {return target===this || this.children.some(x=>x.contains(target));}
  closest(sel) { if(sel==='details') return this.tagName==='DETAILS'?this:this.parent?.closest(sel); }
  querySelector(sel) { return this.children.find(x=>sel === 'summary'?x.tagName==='SUMMARY':x.className===sel.replace(/^(?::scope > )?\./,'')); }
  setAttribute(k,v){this.attrs[k]=v;}
  hasAttribute(k){return Object.hasOwn(this.attrs,k);}
  addEventListener(k, fn){this.events[k]=fn;}
  getBoundingClientRect(){return {height:this.dataset.windowState==='minimized'?47:240};}
  focus(){active=this;}
  showModal(){this.open=true;}
  close(){this.open=false;this.events.close?.();}
  scrollIntoView(){this.scrolled=true;}
}
const nodes=[];
const doc=new E();
const win=new E();
const location={origin:'https://site.example',pathname:'/',search:'',hash:''};
doc.createElement=(tag)=>new E(tag);
doc.querySelectorAll=()=>nodes;
doc.documentElement={classList:new Set()};
doc.documentElement.classList.remove=(x)=>doc.documentElement.classList.delete(x);
doc.body=new E('body');
for(const [i,name] of ['Homepage console','Signal desk'].entries()) {
  const box=new E(i?'details':'section'), h=new E(), b=new E(), p=new E(), light=new E(), target=new E(), summary=new E('summary');
  if(i) {summary.id='support-puzzle';box.append(summary);}
  h.className='window-head'; b.className='window-body'; light.className='lights'; p.dataset.windowPanel=name;
  target.id='body-target-'+i; target.setAttribute('tabindex','-1'); b.append(target); h.append(light); p.append(h,b); box.append(p); doc.body.append(box); nodes.push(p);
}
doc.getElementById=(id)=>{const find=(n)=>n.id===id?n:n.children.map(find).find(Boolean);return find(doc.body)};
vm.runInNewContext(source,{document:doc,window:win,URL,location});
const btns=(p)=>p.children[0].children;
const [panel,lab]=nodes;
const [controls,reopen,exit]=btns(panel);
const [close,minimize,maximize]=controls.children;
const body=panel.children[1], place=panel.parent, modal=doc.body.children.at(-1);
const run=(elm,k,arg)=>elm.events[k](arg);
run(close,'click'); assert(body.hidden && controls.hidden && !reopen.hidden && active===reopen);
run(reopen,'click'); assert(!body.hidden && !controls.hidden && reopen.hidden && active===close);
run(minimize,'click'); assert(body.hidden && active===minimize && minimize.attrs['aria-expanded']==='false');
run(minimize,'click'); assert(!body.hidden && minimize.attrs['aria-expanded']==='true');
run(minimize,'click');
run(maximize,'click');
assert(modal.open && !body.hidden);
assert.equal(place.children[0].style.blockSize, '47px');
run(exit,'click');
assert(!modal.open && body.hidden && active===maximize);
assert.equal(minimize.attrs['aria-expanded'], 'false');
assert.equal(minimize.attrs['aria-label'], 'Restore Homepage console');
run(maximize,'click');
let escaped = false;
run(doc,'keydown',{key:'Escape',preventDefault(){escaped=true;},stopImmediatePropagation(){}});
assert(escaped && !modal.open && body.hidden && active===maximize);
run(minimize,'click');
assert(!body.hidden);

run(maximize,'click'); assert(modal.open && modal.children[0]===panel && active===exit && controls.hidden && doc.documentElement.classList.has('aow-reading-open'));
let stop=0;
run(doc,'keydown',{key:'Escape',preventDefault(){stop++},stopImmediatePropagation(){stop++}});
assert.equal(stop,2); assert(!modal.open && place.children[0]===panel && panel.children[1]===body && active===maximize);
assert(!doc.documentElement.classList.has('aow-reading-open'));
run(maximize,'click'); run(exit,'click'); assert(!modal.open && active===maximize);
run(maximize,'click'); run(modal,'cancel',{preventDefault(){stop++}}); assert(!modal.open && active===maximize);
run(close,'click'); location.hash='#body-target-0'; run(win,'hashchange'); assert(!body.hidden && body.children[0].scrolled && active===body.children[0]);
run(btns(lab)[0].children[1],'click'); assert(lab.children[1].hidden);
location.hash='#support-puzzle'; run(win,'hashchange'); assert(!lab.children[1].hidden && doc.getElementById('support-puzzle').scrolled);
run(btns(lab)[0].children[0],'click');
run(doc,'click',{button:0,target:{closest:()=>({href:'https://site.example/#support-puzzle',hasAttribute:()=>false})}});
assert(!lab.children[1].hidden);
// Returning to an existing history entry is not a new request to reopen it.
location.hash='#body-target-0';
run(close,'click'); body.children[0].scrolled=false;
win.events.pageshow?.({persisted:true});
assert(body.hidden && !reopen.hidden && active===reopen && !body.children[0].scrolled);
run(doc,'click',{button:0,target:{closest:()=>({href:'https://site.example/#body-target-0',hasAttribute:()=>false})}});
assert(!body.hidden && body.children[0].scrolled && active===body.children[0]);
run(minimize,'click'); assert(body.hidden && active===minimize);
win.events.pageshow?.({persisted:true}); assert(body.hidden && active===minimize);
run(minimize,'click');
const showModal=modal.showModal;
modal.showModal=()=>{throw new Error('exception opening modal');};
run(maximize,'click'); assert(!modal.open && place.children[0]===panel && active===maximize);
modal.showModal=showModal;
run(maximize,'click');
run(doc,'click',{button:0,target:{closest:()=>({href:'https://site.example/#body-target-0',hasAttribute:()=>false})}});
assert(!modal.open && place.children[0]===panel);
console.log('PASS: 9 progressive panel declarations; close/reopen, min/restore, native expansion/node identity, focus, Escape/cancel/explicit exit, scroll lock and body/lab hash restore');

// A browser without showModal still gets usable close/minimize controls.
const fallbackDoc = new E('document'), fallbackWin = new E('window');
fallbackDoc.createElement = tag => {
  const el = new E(tag);
  if (tag === 'dialog') el.showModal = undefined;
  return el;
};
fallbackDoc.documentElement = doc.documentElement;
fallbackDoc.body = new E('body');
const fallbackPanel = new E(), fallbackHead = new E(), fallbackBody = new E(), fallbackLights = new E();
fallbackPanel.dataset.windowPanel = 'Support';
fallbackHead.className = 'window-head';
fallbackBody.className = 'window-body';
fallbackLights.className = 'lights';
fallbackHead.append(fallbackLights); fallbackPanel.append(fallbackHead, fallbackBody); fallbackDoc.body.append(fallbackPanel);
fallbackDoc.querySelectorAll = () => [fallbackPanel];
vm.runInNewContext(source, { document: fallbackDoc, window: fallbackWin, URL, location });
const [fallbackGroup, fallbackReopen] = fallbackHead.children;
const [fallbackClose, fallbackMin] = fallbackGroup.children;
assert.equal(fallbackGroup.children.length, 2);
assert.equal(fallbackHead.children.length, 2);
assert.equal(fallbackDoc.body.children.length, 1);
run(fallbackMin, 'click'); assert(fallbackBody.hidden && active === fallbackMin);
run(fallbackMin, 'click'); assert(!fallbackBody.hidden && active === fallbackMin);
run(fallbackClose, 'click'); assert(fallbackBody.hidden && active === fallbackReopen);
run(fallbackReopen, 'click'); assert(!fallbackBody.hidden && active === fallbackClose);
