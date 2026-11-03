export const VERSION=1;
export const PREFIX="debate-quest:v1:";
export function emptyDraft(topicId){return {version:VERSION,topicId,stance:null,claim:"",reasons:["",""],updatedAt:null};}
export function isComplete(d){return ["pro","con"].includes(d.stance)&&Boolean(d.claim.trim())&&Boolean(d.reasons[0].trim());}
export function validateDraft(v,id){
 if(!v||v.version!==VERSION||v.topicId!==id||![null,"pro","con"].includes(v.stance)||typeof v.claim!=="string"||!Array.isArray(v.reasons)||v.reasons.length!==2||v.reasons.some(x=>typeof x!=="string")||v.claim.length>200||v.reasons.some(x=>x.length>500)||!(v.updatedAt===null||typeof v.updatedAt==="string")) throw Error("저장 형식 오류");
 return {version:VERSION,topicId:id,stance:v.stance,claim:v.claim,reasons:[...v.reasons],updatedAt:v.updatedAt};
}
export function createStorage(getStorage=()=>globalThis.localStorage,{prefix=PREFIX,initialDrafts={}}={}){
 const memory=new Map();
 const initial=id=>initialDrafts[id]?validateDraft(initialDrafts[id],id):emptyDraft(id);
 return {
 load(id){if(memory.has(id))return {draft:memory.get(id),error:null};try{const raw=getStorage().getItem(prefix+id);const draft=raw?validateDraft(JSON.parse(raw),id):initial(id);memory.set(id,draft);return {draft,error:null};}catch{const draft=initial(id);memory.set(id,draft);return {draft,error:"저장된 기록을 읽을 수 없습니다. 현재 입력은 유지되며 페이지 파일이나 PDF로 보관할 수 있습니다."};}},
 save(draft){const safe=validateDraft(draft,draft.topicId);memory.set(draft.topicId,safe);try{getStorage().setItem(prefix+draft.topicId,JSON.stringify(safe));return {ok:true};}catch{return {ok:false,error:"브라우저에 저장하지 못했습니다. 창을 닫기 전에 페이지 파일이나 내 작성본 PDF를 다운로드하세요."};}},
 remove(id){try{if(initialDrafts[id])getStorage().setItem(prefix+id,JSON.stringify(emptyDraft(id)));else getStorage().removeItem(prefix+id);memory.set(id,emptyDraft(id));return {ok:true};}catch{return {ok:false,error:"저장소에 접근할 수 없어 기록을 삭제하지 못했습니다."};}}
 };
}
