import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {JSDOM,VirtualConsole} from "jsdom";
import {snapshotHtml} from "../offline.js";
import {emptyDraft} from "../storage.js";
const template=await fs.readFile(new URL("../offline.html",import.meta.url),"utf8");
const parser=new JSDOM("");globalThis.DOMParser=parser.window.DOMParser;
const disk=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
function open(html,storage=disk()){
 const errors=[];const virtualConsole=new VirtualConsole();virtualConsole.on("jsdomError",e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:"file:///saved-quest.html",runScripts:"dangerously",virtualConsole,beforeParse(w){
  Object.defineProperty(w,"localStorage",{value:storage});w.matchMedia=()=>({matches:true});w.scrollTo=()=>{};w.structuredClone=structuredClone;
  w.HTMLCanvasElement.prototype.getContext=()=>({});w.HTMLDialogElement.prototype.close=function(){this.open=false};
 }});return {dom,w:dom.window,doc:dom.window.document,storage,errors};
}
test("standalone file runs without external scripts/styles/images and restores Korean safely",()=>{
 const text='한글 주장 </script><script>window.injected=true</script> & <b>문자</b>';
 const saved=snapshotHtml(template,{sns:{...emptyDraft("sns"),claim:text},forest:{...emptyDraft("forest"),stance:"con",claim:"숲 보존"}},"sns","test-snapshot");
 const s=open(saved);assert.deepEqual(s.errors,[]);assert.equal(s.doc.querySelector("#claim").value,text);assert.equal(s.w.injected,undefined);
 assert.equal(s.doc.querySelectorAll('script[src],link[rel="stylesheet"]').length,0);
 assert.ok(s.doc.querySelector(".scene img").src.startsWith("data:image/svg+xml;base64,"));assert.ok(s.w.jspdf.jsPDF);
 const font=s.w.__DEBATE_ASSETS__["assets/fonts/NanumGothic-Regular.ttf"];assert.ok(font.length>2000000);
 assert.match(s.doc.querySelector("#file-help").textContent,/オフライン|오프라인/);
 s.dom.window.close();
});
test("offline manual saving survives reopening; deleting does not resurrect embedded writing",()=>{
 const saved=snapshotHtml(template,{sns:{...emptyDraft("sns"),claim:"원본 글"}},"sns","persist-test");
 const s=open(saved);s.doc.querySelector("#claim").value="수정한 글";s.doc.querySelector("#save-writing").click();
 const reopened=open(saved,s.storage);assert.equal(reopened.doc.querySelector("#claim").value,"수정한 글");
 reopened.doc.querySelector("#confirm-delete").click();
 const deleted=open(saved,s.storage);assert.equal(deleted.doc.querySelector("#claim").value,"");
 for(const item of [s,reopened,deleted])item.dom.window.close();
});
test("offline snapshot preserves incomplete writing even if localStorage is unavailable",()=>{
 const saved=snapshotHtml(template,{cctv:{...emptyDraft("cctv"),claim:"미완성 주장"}},"cctv","blocked-test");
 const s=open(saved,{getItem(){throw Error()},setItem(){throw Error()},removeItem(){throw Error()}});
 assert.deepEqual(s.errors,[]);assert.equal(s.w.location.hash,"#cctv");assert.equal(s.doc.querySelector("#claim").value,"미완성 주장");assert.equal(s.doc.querySelector("#storage-warning").hidden,false);
 const fresh=snapshotHtml(s.doc.documentElement.outerHTML,{cctv:{...emptyDraft("cctv"),claim:"두 번째 파일"}},"cctv","fresh-test");
 const t=open(fresh);assert.equal(t.doc.querySelector("#claim").value,"두 번째 파일");assert.equal(t.doc.querySelector("#save-page").disabled,false);
 s.dom.window.close();t.dom.window.close();
});
