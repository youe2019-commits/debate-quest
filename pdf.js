import {standards,source} from "./content.js";
let fontPromise;
function toBase64(bytes){let out="";for(let i=0;i<bytes.length;i+=32768)out+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(out);}
async function fontData(){if(globalThis.__DEBATE_ASSETS__)return globalThis.__DEBATE_ASSETS__["assets/fonts/NanumGothic-Regular.ttf"].split(",")[1];if(!fontPromise)fontPromise=fetch(new URL("./assets/fonts/NanumGothic-Regular.ttf",import.meta.url)).then(r=>{if(!r.ok)throw Error("Font HTTP "+r.status);return r.arrayBuffer();}).then(b=>toBase64(new Uint8Array(b))).catch(e=>{fontPromise=null;throw e;});return fontPromise;}
async function picture(topic){
 await document.fonts.ready;
 const img=new Image();img.src=globalThis.__DEBATE_ASSETS__?.[topic.image]||new URL("./"+topic.image,import.meta.url).href;await img.decode();
 const canvas=document.createElement("canvas");canvas.width=1680;canvas.height=680;
 const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
 return canvas.toDataURL("image/png");
}
const clean=s=>String(s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,"");
/** Dependencies can be supplied for deterministic PDF verification outside a browser. */
export async function createPdf(topic,draft,kind,{PDF=globalThis.jspdf?.jsPDF,font,image}={}){
 if(!PDF)throw Error("PDF 라이브러리를 불러오지 못했습니다.");
 const doc=new PDF({unit:"mm",format:"a4",compress:true,putOnlyUsedFonts:true});
 doc.addFileToVFS("NanumGothic.ttf",font||await fontData());
 doc.addFont("NanumGothic.ttf","Nanum","normal");doc.setFont("Nanum");doc.setLineHeightFactor(1.6);
 doc.setProperties({title:"토론 퀘스트 - "+topic.title+(kind==="blank"?" 빈 활동지":" 내 작성본"),subject:topic.motion,author:"토론 퀘스트",creator:"토론 퀘스트"});
 const left=18,width=174,bottom=274;let y=20;
 const text=(str,size=10,color=[47,57,75])=>{doc.setFontSize(size);doc.setTextColor(...color);doc.text(clean(str),left,y);};
 const nextPage=()=>{doc.addPage();y=21;};
 const paragraph=(str,size=10,line=5.8)=>{doc.setFontSize(size);doc.setTextColor(58,66,82);const lines=doc.splitTextToSize(clean(str),width);for(const s of lines){if(y+line>bottom)nextPage();doc.text(s,left,y);y+=line;}y+=3;};
 const heading=(str)=>{if(y+17>bottom)nextPage();doc.setFillColor(241,237,250);doc.roundedRect(left,y-5,width,10,2,2,"F");text(str,11,[99,73,164]);y+=12;};
 text("DEBATE QUEST  /  QUEST "+topic.number,9,[114,86,216]);y+=11;text(topic.title,20);y+=10;
 paragraph(topic.motion,12,7);
 doc.addImage(image||await picture(topic),"PNG",left,y,width,70.4);y+=77;
 text("수업을 위해 만든 가상 상황 · 실제 사건이나 현행 제도를 설명하지 않습니다.",8,[125,128,141]);y+=9;
 for(const p of topic.passage)paragraph(p,9.4,5.4);
 for(const [term,meaning] of topic.terms)paragraph(term+" : "+meaning,8.3,4.7);
 nextPage();
 text(kind==="blank"?"나의 생각 활동지":"나의 생각 기록",18);y+=11;
 paragraph(topic.motion,11,6);
 if(kind==="blank"){text("이름 또는 별명: __________________    날짜: __________________",9);y+=13;}
 heading("01  나의 입장");
 text(kind==="blank"?"[  ] 찬성     [  ] 반대":draft.stance==="pro"?"찬성":draft.stance==="con"?"반대":"아직 선택하지 않음",11);y+=14;
 const field=(label,value,height)=>{
 heading(label);
 if(kind==="blank"){doc.setDrawColor(217,220,229);for(let n=0;n<height;n+=10){if(y+10>bottom)nextPage();doc.line(left,y+4,left+width,y+4);y+=10;}y+=5;}
 else {paragraph(value||"(아직 작성하지 않음)",10,6);y+=5;}
 };
 field("02  나의 주장",draft.claim,30);
 field("03  근거 1",draft.reasons[0],40);
 field("04  근거 2 · 선택",draft.reasons[1],40);
 if(y+12>bottom)nextPage();
 paragraph("생각 점검: 주장과 근거가 연결되나요? 구체적인 사례가 있나요? 다른 입장도 생각해 봤나요?",8.2,4.8);
 const codes=topic.standards.map(k=>standards[k].code).join(" · ");
 // Sources are compact enough to keep every blank worksheet exactly two pages.
 doc.setFontSize(7.2);doc.setTextColor(128,132,145);
 const foot=doc.splitTextToSize("교육과정 연결: "+codes+" | "+source.title+" | 교육과정 MCP 확인 · 중1 눈높이로 재구성",width);
 for(let i=1;i<=doc.getNumberOfPages();i++){doc.setPage(i);doc.setDrawColor(225,226,234);doc.line(left,280,192,280);doc.setFont("Nanum");doc.setFontSize(7.2);doc.setTextColor(128,132,145);doc.text(foot,left,284);doc.text(String(i)+" / "+doc.getNumberOfPages(),192,292,{align:"right"});}
 return doc;
}
export async function downloadPdf(topic,draft,kind){
 const doc=await createPdf(topic,draft,kind);
 doc.save("토론퀘스트_"+topic.title+"_"+(kind==="blank"?"빈활동지":"내작성본")+".pdf");
}
