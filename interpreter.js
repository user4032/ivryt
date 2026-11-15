/* Ivrit Studio — minimal interpreter for a right-to-left Hebrew programming language.
   No eval, Function, or network access. */
class IvritError extends Error {
  constructor(message, line) { super(message); this.name = 'IvritError'; this.line = line || null; }
}

class IvritInterpreter {
  constructor(options = {}) {
    this.maxSteps = options.maxSteps || 20000;
    this.maxDepth = options.maxDepth || 50;
    this.stepCount = 0;
    this.functions = new Map();
    this.onPrint = options.onPrint || (() => {});
    this.startTime = 0;
  }

  error(message, line) { throw new IvritError(message, line); }

  stripComment(line) {
    let quote = null, escaped = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (escaped) { escaped = false; continue; }
      if (quote && c === '\\') { escaped = true; continue; }
      if (c === quote) { quote = null; continue; }
      if (!quote && (c === '"' || c === "'")) { quote = c; continue; }
      if (!quote && (c === '#' || (c === '/' && line[i + 1] === '/'))) return line.slice(0, i);
    }
    return line;
  }

  tokenize(s, line) {
    const out = [];
    const words = {
      'גדול_מ': '>', 'קטן_מ': '<', 'גדול_או_שווה': '>=',
      'קטן_או_שווה': '<=', 'שווה_ל': '==', 'שונה_מ': '!=',
      'וגם': '&&', 'או': '||', 'לא': '!',
      'ועוד': '+', 'פחות': '-', 'כפול': '*', 'חלקי': '/', 'שארית': '%'
    };
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/u.test(c)) { i++; continue; }
      if (c === '"' || c === "'") {
        let quote = c, result = '', closed = false;
        i++;
        while (i < s.length) {
          const d = s[i++];
          if (d === quote) { closed = true; break; }
          if (d === '\\') {
            if (i >= s.length) this.error('מחרוזת לא הושלמה / Незавершений рядок', line);
            const e = s[i++];
            result += ({'n':'\n','t':'\t','r':'\r'}[e] ?? e);
          } else result += d;
        }
        if (!closed) this.error('Незакриті лапки', line);
        out.push({type: 'literal', value: result}); continue;
      }
      const rest = s.slice(i);
      const number = /^(?:\d+(?:\.\d+)?|\.\d+)/u.exec(rest);
      if (number) { out.push({type:'literal',value:Number(number[0])}); i += number[0].length; continue; }
      const ident = /^[\p{L}_][\p{L}\p{N}_]*/u.exec(rest);
      if (ident) {
        const w = ident[0];
        if (w === 'נכון' || w === 'שקר') out.push({type:'literal',value:w === 'נכון'});
        else if (Object.prototype.hasOwnProperty.call(words,w)) out.push({type:'operator',value:words[w]});
        else out.push({type:'identifier',value:w});
        i += w.length; continue;
      }
      const two = s.slice(i,i+2);
      if (['>=','<=','==','!=','&&','||'].includes(two)) { out.push({type:'operator',value:two}); i += 2; continue; }
      if ('+-*/%><!'.includes(c)) { out.push({type:'operator',value:c}); i++; continue; }
      if ('(),'.includes(c)) { out.push({type:c,value:c}); i++; continue; }
      this.error(`Невідомий символ «${c}»`, line);
    }
    out.push({type:'eof'});
    return out;
  }

  expression(source, line) {
    const t = this.tokenize(source,line);
    let pos = 0;
    const peek = () => t[pos];
    const next = () => t[pos++];
    const expect = (type) => {
      if (peek().type !== type) this.error(`Очікується «${type}»`, line);
      return next();
    };
    const precedence = {'||':1,'&&':2,'==':3,'!=':3,'>':4,'<':4,'>=':4,'<=':4,'+':5,'-':5,'*':6,'/':6,'%':6};
    const parse = (minPrec = 0) => {
      let tok = next(), left;
      if (tok.type === 'literal') left = {kind:'literal',value:tok.value,line};
      else if (tok.type === 'identifier') left = {kind:'variable',name:tok.value,line};
      else if (tok.type === '(') { left = parse(0); expect(')'); }
      else if (tok.type === 'operator' && ['-','+','!'].includes(tok.value))
        left = {kind:'unary',op:tok.value,right:parse(7),line};
      else this.error(`Неправильний вираз: «${source}»`, line);
      while (peek().type === '(') {
        if (left.kind !== 'variable') this.error('Функцію викликано неправильно', line);
        next(); const args = [];
        if (peek().type !== ')') {
          do { args.push(parse(0)); if (peek().type !== ',') break; next(); } while (true);
        }
        expect(')'); left = {kind:'call',name:left.name,args,line};
      }
      while (peek().type === 'operator' && (precedence[peek().value] || 0) >= minPrec) {
        const op = peek().value, prec = precedence[op];
        if (!prec) break;
        next(); const right = parse(prec + 1);
        left = {kind:'binary',op,left,right,line};
      }
      return left;
    };
    const result = parse(0);
    if (peek().type !== 'eof') this.error(`Зайвий фрагмент у виразі «${source}»`, line);
    return result;
  }

  parse(source) {
    const root = [];
    const stack = [{kind:'root',body:root}];
    const id = '[\\p{L}_][\\p{L}\\p{N}_]*';
    const declarations = new RegExp(`^הגדר\\s+(${id})\\s+להיות\\s+(.+)$`,'u');
    const assignments = new RegExp(`^(${id})\\s*=\\s*(.+)$`,'u');
    const funcDef = new RegExp(`^פונקציה\\s+(${id})\\s*\\(([^)]*)\\)$`,'u');
    const lines = source.replace(/\r\n?/g,'\n').split('\n');
    for (let index = 0; index < lines.length; index++) {
      const lineNo = index+1, line = this.stripComment(lines[index]).trim();
      if (!line) continue;
      const frame = stack[stack.length-1];
      if (line === 'סוף') {
        if (stack.length === 1) this.error('Зайве слово סוף',lineNo);
        stack.pop(); continue;
      }
      if (line === 'אחרת') {
        if (frame.kind !== 'if' || frame.inElse) this.error('אחרת можна використовувати лише один раз після אם',lineNo);
        frame.inElse = true; frame.body = frame.node.elseBody; continue;
      }
      let match, node;
      if ((match = line.match(declarations))) node = {type:'declare',name:match[1],expr:this.expression(match[2],lineNo),line:lineNo};
      else if (line.startsWith('הדפס ')) node = {type:'print',expr:this.expression(line.slice('הדפס '.length),lineNo),line:lineNo};
      else if ((match = line.match(/^אם\s+(.+)\s+אז$/u))) {
        node = {type:'if',expr:this.expression(match[1],lineNo),thenBody:[],elseBody:[],line:lineNo};
        frame.body.push(node); stack.push({kind:'if',node,body:node.thenBody,inElse:false,line:lineNo}); continue;
      }
      else if ((match = line.match(/^כל_עוד\s+(.+)\s+עשה$/u))) {
        node = {type:'while',expr:this.expression(match[1],lineNo),body:[],line:lineNo};
        frame.body.push(node); stack.push({kind:'while',node,body:node.body,line:lineNo}); continue;
      }
      else if ((match = line.match(funcDef))) {
        const args = match[2].trim() ? match[2].split(',').map(s=>s.trim()) : [];
        if (args.some(a=>!new RegExp(`^${id}$`,'u').test(a)) || new Set(args).size!==args.length)
          this.error('Некоректні або повторені аргументи функції',lineNo);
        node = {type:'function',name:match[1],params:args,body:[],line:lineNo};
        frame.body.push(node); stack.push({kind:'function',node,body:node.body,line:lineNo}); continue;
      }
      else if ((match = line.match(/^החזר(?:\s+(.+))?$/u))) node = {type:'return',expr:match[1] ? this.expression(match[1],lineNo) : null,line:lineNo};
      else if ((match = line.match(assignments))) node = {type:'assign',name:match[1],expr:this.expression(match[2],lineNo),line:lineNo};
      else this.error(`Невідома команда «${line}»`,lineNo);
      frame.body.push(node);
    }
    if (stack.length > 1) this.error(`Немає סוף для блоку з рядка ${stack[stack.length-1].line}`,stack[stack.length-1].line);
    return root;
  }

  tick(line) {
    this.stepCount++;
    if (this.stepCount > this.maxSteps || (this.stepCount%64===0 && Date.now()-this.startTime>1500))
      this.error('Забагато операцій. Можливо, нескінченний цикл.',line);
  }

  lookup(scope,name,line) {
    for (let cur = scope; cur; cur = cur.parent)
      if (Object.prototype.hasOwnProperty.call(cur.vars,name)) return cur.vars[name];
    this.error(`Змінну «${name}» не визначено`,line);
  }

  assign(scope,name,value,line) {
    for (let cur = scope; cur; cur = cur.parent)
      if (Object.prototype.hasOwnProperty.call(cur.vars,name)) { cur.vars[name]=value; return; }
    this.error(`Змінну «${name}» не визначено. Спочатку використай הגדר.`,line);
  }

  format(value) {
    if (value === true) return 'נכון';
    if (value === false) return 'שקר';
    if (value === null || value === undefined) return 'ריק';
    return String(value);
  }

  evaluate(node,scope,depth) {
    if (!node) return null;
    if (node.kind === 'literal') return node.value;
    if (node.kind === 'variable') return this.lookup(scope,node.name,node.line);
    if (node.kind === 'unary') {
      const v = this.evaluate(node.right,scope,depth);
      return node.op === '!' ? !v : node.op==='-' ? -Number(v) : Number(v);
    }
    if (node.kind === 'binary') {
      const a = this.evaluate(node.left,scope,depth);
      if (node.op === '&&') return a && this.evaluate(node.right,scope,depth);
      if (node.op === '||') return a || this.evaluate(node.right,scope,depth);
      const b = this.evaluate(node.right,scope,depth);
      switch(node.op) {
        case '+': return (typeof a==='string'||typeof b==='string') ? this.format(a)+this.format(b) : a+b;
        case '-': return Number(a)-Number(b);
        case '*': return Number(a)*Number(b);
        case '/': if (Number(b)===0) this.error('Ділення на нуль',node.line); return Number(a)/Number(b);
        case '%': if (Number(b)===0) this.error('Ділення на нуль',node.line); return Number(a)%Number(b);
        case '==': return a === b;
        case '!=': return a !== b;
        case '>': return a > b;
        case '<': return a < b;
        case '>=': return a >= b;
        case '<=': return a <= b;
      }
    }
    if (node.kind === 'call') {
      if (depth >= this.maxDepth) this.error('Перевищено глибину виклику функцій',node.line);
      const args = node.args.map(arg=>this.evaluate(arg,scope,depth));
      if (node.name === 'אורך') return Array.from(this.format(args[0] ?? '')).length;
      if (node.name === 'מספר') return Number(args[0]);
      if (node.name === 'טקסט') return this.format(args[0]);
      if (node.name === 'עגל') return Math.round(Number(args[0]));
      const fn = this.functions.get(node.name);
      if (!fn) this.error(`Функцію «${node.name}» не визначено`,node.line);
      if (args.length !== fn.params.length) this.error(`Функція «${node.name}» очікує ${fn.params.length} аргументів`,node.line);
      const local = {vars:Object.create(null),parent:fn.closure};
      fn.params.forEach((p,i)=>{ local.vars[p] = args[i]; });
      const out = this.runBlock(fn.body,local,depth+1,true);
      return out.returned ? out.value : null;
    }
    this.error('Невідомий тип виразу',node.line);
  }

  runBlock(body,scope,depth,inFunction) {
    for (const s of body) {
      this.tick(s.line);
      switch(s.type) {
        case 'declare':
          if (Object.prototype.hasOwnProperty.call(scope.vars,s.name)) this.error(`Змінна «${s.name}» вже існує`,s.line);
          scope.vars[s.name] = this.evaluate(s.expr,scope,depth); break;
        case 'assign': this.assign(scope,s.name,this.evaluate(s.expr,scope,depth),s.line); break;
        case 'print': this.onPrint(this.format(this.evaluate(s.expr,scope,depth))); break;
        case 'function': this.functions.set(s.name,{...s,closure:scope}); break;
        case 'if': {
          const result = this.runBlock(this.evaluate(s.expr,scope,depth) ? s.thenBody : s.elseBody,scope,depth,inFunction);
          if (result.returned) return result;
          break;
        }
        case 'while': {
          while (this.evaluate(s.expr,scope,depth)) {
            this.tick(s.line);
            const result = this.runBlock(s.body,scope,depth,inFunction);
            if (result.returned) return result;
          }
          break;
        }
        case 'return':
          if (!inFunction) this.error('החזר дозволено лише всередині функції',s.line);
          return {returned:true,value:s.expr ? this.evaluate(s.expr,scope,depth) : null};
      }
    }
    return {returned:false,value:null};
  }

  execute(source) {
    this.stepCount = 0; this.functions.clear(); this.startTime = Date.now();
    const ast = this.parse(source);
    const global = {vars:Object.create(null),parent:null};
    this.runBlock(ast,global,0,false);
    return {steps:this.stepCount,variables:Object.keys(global.vars).length};
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = {IvritInterpreter,IvritError};

