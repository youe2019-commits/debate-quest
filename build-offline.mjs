import fs from "node:fs/promises";
const root=new URL("./",import.meta.url);
const read=name=>fs.readFile(new URL(name,root),"utf8");
const assets={};
for(const name of ["sns","cctv","forest","favicon"]){const key="assets/"+name+".svg";assets[key]="data:image/svg+xml;base64,"+(await fs.readFile(new URL(key,root))).toString("base64");}
assets["assets/fonts/NanumGothic-Regular.ttf"]="data:font/ttf;base64,"+(await fs.readFile(new URL("assets/fonts/NanumGothic-Regular.ttf",root))).toString("base64");
let css=await read("styles.css");
css=css.replace("./assets/fonts/NanumGothic-Regular.ttf",assets["assets/fonts/NanumGothic-Regular.ttf"]);
let bundle="";
for(const file of ["content.js","storage.js","pdf.js","offline.js","app.js"]){
 let code=await read(file);
 code=code.replace(/^import .*;\r?$/gm,"").replace(/^export /gm,"").replaceAll("import.meta.url","document.baseURI");
 if(file==="app.js")code=code.replace('src="./${t.image}"','src="${globalThis.__DEBATE_ASSETS__[t.image]}"');
 bundle+=code+"\n";
}
const safeScript=code=>code.replace(/<\/script/gi,"<\\/script");
let html=await read("index.html");
html=html.replace('<html lang="ko">','<html lang="ko" data-offline="true">')
 .replace('./assets/favicon.svg',assets["assets/favicon.svg"])
 .replace('<link rel="stylesheet" href="./styles.css">',()=>"<style>"+css+"</style>")
 .replace('<script src="./assets/vendor/jspdf.umd.min.js" defer></script><script type="module" src="./app.js"></script>',()=>
  '<!-- OFFLINE_SCRIPTS -->');
// Keep third-party licenses in the standalone file too.
const licenses={jsPDF:await read("assets/vendor/LICENSE-jsPDF.txt"),NanumGothic:await read("assets/fonts/OFL.txt")};
// Substitute the placeholder without interpreting dollar signs in vendor code.
const scripts='<script>'+safeScript((await read("assets/vendor/jspdf.umd.min.js")).replace(/\/\/# sourceMappingURL=.*$/gm,""))+'</script>'+
 '<script>globalThis.__DEBATE_ASSETS__='+JSON.stringify(assets)+';</script>'+
 '<script type="application/json" id="bundled-licenses">'+JSON.stringify(licenses).replace(/</g,"\\u003c")+'</script>'+
 '<script>'+safeScript('(()=>{\n'+bundle+'\n})();')+'</script>';
html=html.replace('<!-- OFFLINE_SCRIPTS -->',()=>scripts);
await fs.writeFile(new URL("offline.html",root),html);
console.log("Built offline.html ("+Buffer.byteLength(html)+" bytes)");
