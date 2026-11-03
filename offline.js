import {validateDraft} from "./storage.js";

export function readSnapshot(){
 try{
  const value=JSON.parse(document.querySelector("#saved-drafts")?.textContent||"null");
  if(!value||typeof value.id!=="string"||!/^[a-z0-9-]+$/i.test(value.id))return null;
  const drafts={};
  for(const id of ["sns","cctv","forest"])if(value.drafts?.[id])drafts[id]=validateDraft(value.drafts[id],id);
  return {id:value.id,topic:["sns","cctv","forest"].includes(value.topic)?value.topic:"sns",drafts};
 }catch{return null;}
}

export function snapshotHtml(template,drafts,topic,id){
 const parsed=new DOMParser().parseFromString(template,"text/html");
 const seed=parsed.querySelector("#saved-drafts");
 if(!seed)throw Error("페이지 파일 형식 오류");
 // Text is JSON, never executable HTML (including </script> in student writing).
 seed.textContent=JSON.stringify({id,topic,drafts}).replace(/</g,"\\u003c");
 for(const selector of ["#quest","#topic-nav"])parsed.querySelector(selector).replaceChildren();
 const toast=parsed.querySelector("#toast");toast.hidden=true;toast.textContent="";
 parsed.querySelector("#delete-dialog").removeAttribute("open");
 parsed.querySelector("#save-page").removeAttribute("disabled");
 return "<!doctype html>\n"+parsed.documentElement.outerHTML;
}

export async function downloadPage(drafts,topic){
 let template;
 if(document.documentElement.dataset.offline==="true")template=document.documentElement.outerHTML;
 else{
  const response=await fetch(new URL("./offline.html",import.meta.url));
  if(!response.ok)throw Error("페이지 파일 HTTP "+response.status);
  template=await response.text();
 }
 const id=globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
 const html=snapshotHtml(template,drafts,topic,id);
 const url=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}));
 const link=document.createElement("a");link.href=url;link.download="토론퀘스트_내페이지_"+new Date().toISOString().slice(0,10)+".html";
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
