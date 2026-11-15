/* Ivrit Studio — editor UI. The language runtime is provided by interpreter.js. */
'use strict';
const SAMPLES = {
 welcome:`# התוכנית הראשונה שלי
הגדר שם להיות "עולם"
הגדר גיל להיות 20

הדפס "שלום, " + שם + "!"

אם גיל גדול_מ 18 אז
    הדפס "ברוכים הבאים לסטודיו"
אחרת
    הדפס "שלום!"
סוף`,
 loop:`# סופרים מאחת עד חמש
הגדר מונה להיות 1

כל_עוד מונה קטן_או_שווה 5 עשה
    הדפס "מספר: " + מונה
    מונה = מונה ועוד 1
סוף

הדפס "סיימנו!"`,
 function:`# פונקציות בעברית
פונקציה ברכה(שם)
    החזר "שלום לך, " + שם + "!"
סוף

הדפס ברכה("דניס")
הדפס ברכה("עולם")`,
 math:`# חשבון בעברית
הגדר מחיר להיות 15
הגדר כמות להיות 3
הגדר סך להיות מחיר כפול כמות

הדפס "מחיר סופי: " + סך

אם סך גדול_או_שווה 40 אז
    הדפס "הנחה זמינה"
סוף`
};
const $=id=>document.getElementById(id);
const editor=$('code'), highlight=$('highlight'), numbers=$('numbers'), sampleSelect=$('sampleSelect'), terminal=$('terminal'), status=$('runStatus');
const KEYWORDS=new Set(['הגדר','להיות','הדפס','אם','אז','אחרת','סוף','כל_עוד','עשה','פונקציה','החזר']);
const OPS=new Set(['גדול_מ','קטן_מ','גדול_או_שווה','קטן_או_שווה','שווה_ל','שונה_מ','וגם','או','לא','ועוד','פחות','כפול','חלקי','שארית']);
const BUILTINS=new Set(['אורך','מספר','טקסט','עגל']);
const escapeHTML=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function syntax(source){let output='',i=0;while(i<source.length){let c=source[i],rest=source.slice(i);
 if(c==='#'||(c==='/'&&source[i+1]==='/')){let e=source.indexOf('\n',i),j=e<0?source.length:e;output+=`<span class="tok-comment">${escapeHTML(source.slice(i,j))}</span>`;i=j;continue;}
 if(c==='"'||c==="'"){const q=c,start=i++;let esc=false;while(i<source.length){let ch=source[i++];if(esc){esc=false;continue;}if(ch==='\\'){esc=true;continue;}if(ch===q)break;}output+=`<span class="tok-string">${escapeHTML(source.slice(start,i))}</span>`;continue;}
 const num=/^(?:\d+(?:\.\d+)?|\.\d+)/u.exec(rest);if(num){output+=`<span class="tok-num">${num[0]}</span>`;i+=num[0].length;continue;}
 const ident=/^[\p{L}_][\p{L}\p{N}_]*/u.exec(rest);if(ident){const word=ident[0],cls=KEYWORDS.has(word)?'tok-key':OPS.has(word)?'tok-op':['נכון','שקר'].includes(word)?'tok-bool':BUILTINS.has(word)?'tok-func':null;output+=cls?`<span class="${cls}">${escapeHTML(word)}</span>`:escapeHTML(word);i+=word.length;continue;}
 output+=escapeHTML(c);i++;}return output+'\n';}
function cursor(){const prefix=editor.value.slice(0,editor.selectionStart),lines=prefix.split('\n');$('cursorInfo').textContent=`LINE ${lines.length} : ${Array.from(lines.at(-1)).length+1}`;}
function refresh(){highlight.innerHTML=syntax(editor.value);numbers.textContent=Array.from({length:editor.value.split('\n').length},(_,i)=>i+1).join('\n');syncScroll();cursor();try{localStorage.setItem('ivrit-v2-source',editor.value);}catch(_){}}
function syncScroll(){highlight.scrollTop=editor.scrollTop;highlight.scrollLeft=editor.scrollLeft;numbers.style.transform=`translateY(${-editor.scrollTop}px)`;}
function outputLine(value,kind='normal'){const div=document.createElement('div');div.className='output-line'+(kind==='error'?' error':'');const bullet=document.createElement('span');bullet.textContent=kind==='error'?'×':'›';const content=document.createElement('span');content.className='output-text';content.dir='auto';content.textContent=String(value);div.append(bullet,content);terminal.append(div);terminal.scrollTop=terminal.scrollHeight;}
function run(){terminal.replaceChildren();status.textContent='RUNNING...';let lines=0,hidden=0;const start=performance.now();try{const runtime=new IvritInterpreter({maxSteps:20000,onPrint:text=>{if(lines<250){outputLine(text);lines++;}else hidden++;}});const result=runtime.execute(editor.value);if(hidden)outputLine(`${hidden} additional lines hidden`);if(!lines)outputLine('Program finished without output');status.textContent=`SUCCESS / ${result.steps} STEPS / ${(performance.now()-start).toFixed(1)} MS`;}catch(err){outputLine(`${err.line?'LINE '+err.line+' / ':''}${err.message}`,'error');status.textContent='EXECUTION ERROR';}}
function download(){const blob=new Blob([editor.value],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ראשי.ivrit';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function setSample(key){editor.value=SAMPLES[key];refresh();}
$('runCode').addEventListener('click',run);
$('clearConsole').addEventListener('click',()=>{terminal.replaceChildren();status.textContent='CONSOLE CLEARED';});
$('downloadFile').addEventListener('click',download);
$('openFile').addEventListener('click',()=>$('fileInput').click());
$('fileInput').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>1024*1024){alert('Maximum file size: 1 MB');return;}editor.value=await file.text();refresh();status.textContent='IMPORTED '+file.name;e.target.value='';});
$('resetExample').addEventListener('click',()=>{setSample(sampleSelect.value);terminal.replaceChildren();status.textContent='EXAMPLE RESTORED';});
sampleSelect.addEventListener('change',()=>{setSample(sampleSelect.value);run();});
editor.addEventListener('input',refresh);editor.addEventListener('scroll',syncScroll);editor.addEventListener('keyup',cursor);editor.addEventListener('click',cursor);
editor.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();editor.setRangeText('    ',editor.selectionStart,editor.selectionEnd,'end');refresh();}if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();run();}});
window.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();run();}if(e.key.toLowerCase()==='s'&&(e.ctrlKey||e.metaKey)){e.preventDefault();download();}});
$('fileEntry').addEventListener('click',()=>editor.focus());
const menu=$('mobileNav'),toggle=$('menuToggle');toggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false');}));
try{editor.value=localStorage.getItem('ivrit-v2-source')??SAMPLES.welcome;}catch(_){editor.value=SAMPLES.welcome;}
refresh();run();
