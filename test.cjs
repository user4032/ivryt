const assert=require('node:assert/strict');const{Runtime,parse,IvritError}=require('./engine.js');
function run(files,entry='main.ivrit'){let out=[];let stats=new Runtime({files,onPrint:s=>out.push(s)}).execute(entry);return{out,stats};}
const tests=[
['hello',{'main.ivrit':'הגדר שם להיות "עולם"\nהדפס "שלום, " + שם'},['שלום, עולם']],
['arithmetic',{'main.ivrit':'הדפס (3 + 4) כפול 2\nהדפס 10 גדול_מ 2'},['14','נכון']],
['conditions',{'main.ivrit':'אם 1 קטן_מ 2 אז\nהדפס "yes"\nאחרת\nהדפס "no"\nסוף'},['yes']],
['loop',{'main.ivrit':'הגדר x להיות 3\nכל_עוד x גדול_מ 0 עשה\nהדפס x\nx = x פחות 1\nסוף'},['3','2','1']],
['functions',{'main.ivrit':'פונקציה כפול_שניים(x)\nהחזר x כפול 2\nסוף\nהדפס כפול_שניים(12)'},['24']],
['arrays',{'main.ivrit':'הגדר x להיות [10, 20]\nהוסף(x, 30)\nx[0] = 5\nהדפס x[0]\nהדפס אורך(x)'},['5','3']],
['objects',{'main.ivrit':'הגדר x להיות {שם: "שרה", גיל: 20}\nx.גיל = 21\nהדפס x.שם\nהדפס x.גיל'},['שרה','21']],
['modules',{'main.ivrit':'ייבא "utils.ivrit"\nהדפס הוסף_שניים(7)','utils.ivrit':'פונקציה הוסף_שניים(x)\nהחזר x + 2\nסוף'},['9']],
['nested',{'main.ivrit':'הגדר x להיות [{שם: "א"}, {שם: "ב"}]\nהדפס x[1].שם'},['ב']],
];
let passed=0;for(let[name,files,expected]of tests){try{assert.deepEqual(run(files).out,expected);passed++;console.log('PASS',name);}catch(e){console.log('FAIL',name,e.stack);process.exitCode=1;}}
for(let[name,files]of [['syntax',{'main.ivrit':'אם נכון אז\nהדפס "a"'}],['infinite',{'main.ivrit':'כל_עוד נכון עשה\nהדפס 1\nסוף'}],['cyclic',{'main.ivrit':'ייבא "b.ivrit"','b.ivrit':'ייבא "main.ivrit"'}]]){try{run(files);throw Error('Expected error');}catch(e){if(e instanceof IvritError){passed++;console.log('PASS error',name)}else{console.log('FAIL error',name,e);process.exitCode=1;}}}console.log('PASSED',passed,'of',tests.length+3);
