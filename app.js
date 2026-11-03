import {topics,standards,source} from "./content.js";
import {createStorage,isComplete,emptyDraft} from "./storage.js";
import {downloadPdf} from "./pdf.js";
import {readSnapshot,downloadPage} from "./offline.js";
const $=s=>document.querySelector(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icon=(name,size=21)=>'<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+({chat:'<path d="M5 4h14a2 2 0 012 2v10a2 2 0 01-2 2H9l-5 4v-4H3V6a2 2 0 012-2z"/><path d="M7 9h10M7 13h6"/>',camera:'<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M8 7l2-3h4l2 3"/><circle cx="12" cy="13" r="3"/>',tree:'<path d="M12 2L6 10h3l-6 8h18l-6-8h3zM12 18v4"/>',book:'<path d="M3 4h6a3 3 0 013 3 3 3 0 013-3h6v15h-6a3 3 0 00-3 2 3 3 0 00-3-2H3zM12 7v14"/>',download:'<path d="M12 3v12m-5-5l5 5 5-5M4 15v6h16v-6"/>'}[name]||'')+'</svg>';
function replaceTopicHash(id){try{history.replaceState(null,"","#"+id);}catch{location.hash=id;}}
const snapshot=readSnapshot();
const store=createStorage(undefined,snapshot?{prefix:"debate-quest:file:"+snapshot.id+":",initialDrafts:snapshot.drafts}:{});
const drafts=new Map();
const errors=new Map();
for(const t of topics){const r=store.load(t.id);drafts.set(t.id,r.draft);if(r.error)errors.set(t.id,r.error);}
let current=topics.find(t=>t.id===location.hash.slice(1))||topics.find(t=>t.id===snapshot?.topic)||topics[0];
let pdfBusy=false,toastTimer;
function toast(message){$("#toast").textContent=message;$("#toast").hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$("#toast").hidden=true;},4500);}
function nav(){
 $("#topic-nav").innerHTML=topics.map(t=>'<a class="topic-link '+t.color+'" href="#'+t.id+'" '+(t.id===current.id?'aria-current="page"':'')+'><span class="nav-icon">'+icon(t.icon)+'</span><span><b>'+t.title+'</b><small>QUEST '+t.number+'</small></span><span class="nav-status '+(isComplete(drafts.get(t.id))?'done':'')+'" aria-label="'+(isComplete(drafts.get(t.id))?'작성 완료':'미완료')+'">'+(isComplete(drafts.get(t.id))?'✓':'›')+'</span></a>').join("");
 const n=topics.filter(t=>isComplete(drafts.get(t.id))).length;
 $("#progress-count").textContent=n+" / 3";$("#progress-fill").style.width=(n/3*100)+"%";$(".progress-track").setAttribute("aria-valuenow",n);
}
function setStatus(){
 const d=drafts.get(current.id),err=errors.get(current.id);
 $("#storage-warning").hidden=!err;$("#storage-warning").textContent=err||"";
 $("#save-status").textContent=err?"저장하지 못함 · PDF로 보관해 주세요":d.updatedAt?"✓ 이 브라우저에 저장됨":"입력하면 이 브라우저에 자동 저장돼요";
 $("#save-status").classList.toggle("error",!!err);
}
function renderRecord(){
 const d=drafts.get(current.id),completed=isComplete(d),has=d.stance||d.claim||d.reasons.some(Boolean);
 $("#record-badge").textContent=completed?"✓ 작성 완료":"작성 중";
 $("#record-badge").classList.toggle("complete",completed);
 $("#record-body").innerHTML=has?'<div class="record-stance">'+(d.stance===null?"아직 입장을 고르지 않았어요":d.stance==="pro"?"나의 선택 · 찬성":"나의 선택 · 반대")+'</div><div class="record-content">'+[["나의 주장",d.claim],["근거 1",d.reasons[0]],["근거 2 · 선택",d.reasons[1]]].map(([k,v])=>'<section><h3>'+k+'</h3><p>'+escape(v||"아직 작성하지 않았어요.")+'</p></section>').join("")+'</div>':'<p class="record-empty">위에서 입장을 고르고 생각을 적어 보세요.<br>나의 기록이 여기에 차곡차곡 모여요.</p>';
 const stages=document.querySelectorAll(".stage");
 stages[1].classList.toggle("done",!!d.stance);stages[2].classList.toggle("done",completed);
 stages[1].querySelector("strong").textContent=d.stance?"✓":"2";stages[2].querySelector("strong").textContent=completed?"✓":"3";
}
function render(){
 nav();$("#breadcrumb").textContent=current.title;document.title=current.title+" · 토론 퀘스트";
 const t=current,d=drafts.get(t.id);
 $("#quest").innerHTML=`
 <section class="quest-card" aria-labelledby="quest-title">
 <div class="quest-heading"><div class="quest-meta"><span class="quest-number">QUEST ${t.number}</span><span class="topic-tag">${t.tag}</span></div><h2 id="quest-title">${t.question}</h2><p class="subtitle">${t.subtitle}</p></div>
 <div class="quest-stage" aria-label="활동 단계"><span class="stage active"><strong>1</strong>상황 살펴보기</span><span class="stage"><strong>2</strong>입장 선택하기</span><span class="stage"><strong>3</strong>생각 펼치기</span></div>
 <div class="quest-body"><figure class="scene"><img src="./${t.image}" alt="${t.alt}" width="840" height="340"><figcaption>수업을 위해 만든 가상 상황</figcaption></figure><div class="conflict-line"><span>${t.conflict[0]}</span><em>AND</em><span>${t.conflict[1]}</span></div>
 <div class="reading-header"><h3 class="section-label"><span class="small-icon">${icon("book",17)}</span>어떤 일이 일어났을까?</h3><span class="fiction">가상 이야기</span></div>
 <div class="passage">${t.passage.map(p=>'<p>'+p+'</p>').join("")}</div>
 <div class="terms">${t.terms.map(([a,b])=>'<span class="term"><b>'+a+'</b>'+b+'</span>').join("")}</div>
 <details class="curriculum"><summary>교육과정 연결 · 성취기준과 출처 보기</summary><div class="curriculum-content"><b>중학교 1~3학년군 · 중1 눈높이로 재구성</b>${t.standards.map(key=>{const s=standards[key];return '<p class="standard"><b>'+s.code+'</b>'+s.text+' <small>(PDF '+s.page+'쪽)</small></p>';}).join("")}<p>${t.connection}</p><p class="source-note">${source.title}<br>자료 ID: ${source.id} · 첨부번호 ${source.attachment}<br>${source.note}<br><a href="${source.url}" target="_blank" rel="noopener noreferrer">국가교육과정정보센터에서 교육과정 찾기 ↗</a></p></div></details></div></section>
 <div class="work-grid"><section class="write-panel" aria-labelledby="choose-heading"><div class="block-heading"><span class="step-badge">02</span><h2 id="choose-heading">너의 선택은?</h2></div><p class="section-help">지금의 생각을 골라 봐. 언제든 바꿀 수 있어.</p>
 <fieldset class="stance-group"><legend>${t.motion}</legend><div class="stance-options"><label class="stance pro"><input type="radio" name="stance" value="pro" ${d.stance==="pro"?"checked":""}><span><b>찬성해요</b><small>이 제안에 동의해요</small></span></label><label class="stance con"><input type="radio" name="stance" value="con" ${d.stance==="con"?"checked":""}><span><b>반대해요</b><small>다른 방향이 필요해요</small></span></label></div></fieldset>
 <div class="block-heading write-heading"><span class="step-badge">03</span><h2>생각에 이유를 더해 봐.</h2></div>
 ${[["claim","나의 주장","200","나는 이 제안에 찬성/반대한다. 왜냐하면…","내 입장을 한 문장으로 표현해 봐요."],["reason1","근거 1","500","그렇게 생각하는 이유는… 예를 들면…","주장을 뒷받침하는 이유와 사례를 적어 봐요."],["reason2","근거 2","500","또 다른 이유는…","다른 관점이나 사례를 하나 더 떠올려 봐요."]].map(([id,label,max,placeholder,hint])=>'<label class="field" for="'+id+'"><span class="field-head"><span>'+label+(id!=="reason2"?'<span class="required-dot" aria-label="필수">*</span>':'')+'</span><small>'+(id==="reason2"?"선택":"필수")+'</small></span><p class="field-hint" id="'+id+'-hint">'+hint+'</p><textarea id="'+id+'" maxlength="'+max+'" rows="'+(id==="claim"?2:3)+'" placeholder="'+placeholder+'" aria-describedby="'+id+'-hint '+id+'-count" '+(id!=="reason2"?'required':'')+'></textarea><span class="counter" id="'+id+'-count">0 / '+max+'</span></label>').join("")}
 <p class="save-line" id="save-status" role="status"></p><div class="write-actions"><button type="button" class="button primary" id="save-writing">내 글 저장</button><button type="button" class="button" id="see-record">내 기록 확인하기 <span aria-hidden="true">↗</span></button></div><p class="save-explainer">자동 저장도 계속돼요. ‘내 글 저장’은 이 브라우저에 저장하며, 파일로 보관하려면 위의 ‘페이지 파일 저장’을 눌러 주세요.</p>
 </section>
 <aside class="right-column" aria-label="생각 도움말과 활동지"><section class="guide-panel"><h3>✦ 생각이 막힐 때</h3><p>필요할 때만 살짝 열어 봐.</p><details class="hint"><summary>찬성 쪽에서 생각해 보기</summary><ul>${t.pro.map(s=>'<li>'+s+'</li>').join("")}</ul></details><details class="hint con"><summary>반대 쪽에서 생각해 보기</summary><ul>${t.con.map(s=>'<li>'+s+'</li>').join("")}</ul></details><hr class="guide-divider"><h3>좋은 근거의 작은 비밀</h3><p class="guide-tip"><b>“그냥 좋아서”에서 한 걸음 더.</b><br>누구에게 어떤 변화가 생기는지<br>구체적인 이유를 붙여 봐.</p><div class="mini-steps"><span><i>①</i>내 주장과 연결되나요?</span><span><i>②</i>이유나 사례가 구체적인가요?</span><span><i>③</i>다른 입장도 생각해 봤나요?</span></div></section><section class="download-box"><h3>종이 위에서도 탐험하기</h3><p>생각을 손으로 적고 싶다면<br>빈 활동지를 내려받아 봐.</p><button class="button" data-pdf="blank">${icon("download",14)}빈 활동지 PDF</button></section></aside></div>
 <section class="record-panel" id="my-record" aria-labelledby="record-heading"><div class="record-top"><h2 id="record-heading" tabindex="-1">나의 생각 기록</h2><span id="record-badge" class="record-badge">작성 중</span></div><div id="record-body"></div><div class="record-actions"><button class="button primary" data-pdf="filled">${icon("download",14)}내 작성본 PDF</button><button class="button" id="edit-record">계속 수정하기</button><button class="button" id="print-record">인쇄</button><button class="delete-record" id="delete-record">이 주제 기록 삭제</button></div><p class="source-note">이 브라우저에만 저장돼요. 브라우저 데이터를 지우면 기록이 사라질 수 있어요.<br>공용 기기에서는 다음 사람이 기록을 볼 수 있으니 사용 후 삭제해 주세요.</p></section>`;
 ["claim","reason1","reason2"].forEach((id,i)=>{$("#"+id).value=i===0?d.claim:d.reasons[i-1];updateCounter(id);});
 document.querySelectorAll('input[name="stance"]').forEach(el=>el.addEventListener("change",saveInput));
 document.querySelectorAll("textarea").forEach(el=>{el.addEventListener("input",e=>{updateCounter(el.id);if(!e.isComposing)saveInput();});el.addEventListener("compositionend",()=>{el.value=el.value.slice(0,el.maxLength);saveInput();});});
 $("#see-record").addEventListener("click",()=>{$("#my-record").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});$("#record-heading").focus({preventScroll:true});if(!isComplete(drafts.get(current.id)))toast("초안도 기록됩니다. 입장·주장·근거 1을 채우면 작성 완료예요.");});
 $("#edit-record").addEventListener("click",()=>$("#claim").focus());
 $("#save-writing").addEventListener("click",()=>{const result=saveInput();toast(result.ok?"✓ 현재 주제의 글을 이 브라우저에 저장했어요.":result.error);});
 $("#print-record").addEventListener("click",()=>window.print());
 $("#delete-record").addEventListener("click",()=>$("#delete-dialog").showModal());
 document.querySelectorAll("[data-pdf]").forEach(b=>b.addEventListener("click",()=>exportPdf(b.dataset.pdf)));
 renderRecord();setStatus();if(pdfBusy)document.querySelectorAll("[data-pdf]").forEach(b=>b.disabled=true);
}
function updateCounter(id){const el=$("#"+id);$("#"+id+"-count").textContent=el.value.length+" / "+el.maxLength;}
function saveInput(){
 const d={...drafts.get(current.id),stance:document.querySelector('input[name="stance"]:checked')?.value||null,claim:$("#claim").value.slice(0,200),reasons:[$("#reason1").value.slice(0,500),$("#reason2").value.slice(0,500)],updatedAt:new Date().toISOString()};
 drafts.set(current.id,d);const result=store.save(d);if(result.ok)errors.delete(current.id);else errors.set(current.id,result.error);
 ["claim","reason1","reason2"].forEach(updateCounter);nav();renderRecord();setStatus();
 return result;
}
async function exportPdf(kind){
 if(pdfBusy)return;pdfBusy=true;const topic=current,draft=structuredClone(drafts.get(current.id));
 document.querySelectorAll("[data-pdf]").forEach(b=>b.disabled=true);toast("한글 글꼴을 준비하고 PDF를 만들고 있어요.");
 try{await downloadPdf(topic,draft,kind);toast("PDF가 준비됐어요. 브라우저 다운로드 목록을 확인해 주세요.");}catch(error){console.error("PDF export failed",error);toast("PDF를 만들지 못했어요. 다시 시도하거나 인쇄 버튼을 이용해 주세요.");}finally{pdfBusy=false;document.querySelectorAll("[data-pdf]").forEach(b=>b.disabled=false);}
}
$("#cancel-delete").addEventListener("click",()=>$("#delete-dialog").close());
$("#confirm-delete").addEventListener("click",()=>{const result=store.remove(current.id);$("#delete-dialog").close();if(result.ok){drafts.set(current.id,emptyDraft(current.id));errors.delete(current.id);render();$("#delete-record").focus();toast("이 주제의 기록을 삭제했어요.");}else{errors.set(current.id,result.error);setStatus();toast(result.error);}});
window.addEventListener("hashchange",()=>{const next=topics.find(t=>t.id===location.hash.slice(1));if(!next){replaceTopicHash(current.id);return;}current=next;render();$("#main").focus({preventScroll:true});window.scrollTo({top:0,behavior:"instant"});});
$("#save-page").addEventListener("click",async()=>{
 const button=$("#save-page");if(button.disabled)return;saveInput();
 const captured=structuredClone(Object.fromEntries(drafts)),topicId=current.id;
 button.disabled=true;toast("글과 그림, 한글 글꼴을 담은 페이지 파일을 준비하고 있어요.");
 try{await downloadPage(captured,topicId);toast("페이지 파일이 준비됐어요. 다운로드 목록에서 HTML 파일을 열어 보세요.");}
 catch(error){console.error("Page export failed",error);toast("페이지 파일을 만들지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.");}
 finally{button.disabled=false;}
});
if(document.documentElement.dataset.offline==="true")$("#file-help").textContent="오프라인 페이지예요. 수정한 글을 파일에도 남기려면 ‘페이지 파일 저장’으로 새 파일을 받아 주세요. 파일을 공유하면 글도 함께 전달돼요.";
if(!topics.some(t=>t.id===location.hash.slice(1)))replaceTopicHash(current.id);
render();
