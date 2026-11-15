# Ivrit Studio v0.4

An experimental Hebrew-language programming IDE with an original monochrome landing page, a separate CodeMirror 6 right-to-left Studio, interactive lessons, documentation, and a safe browser-side AST interpreter.

## Pages

- `/` — product homepage
- `/studio.html` — CodeMirror 6 Hebrew RTL IDE
- `/learn.html` — Ivrit Academy (8 interactive lessons)
- `/docs.html` — grammar, library, examples and dictionary

## Local development

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Then open the localhost URL printed by Vite.

## Run tests

```bash
npm test
```

Tests cover expressions, conditions, recursion, arrays, objects, modules, syntax errors and execution limits.

## Vercel deployment

1. Unzip the repository, push the **contents** to a GitHub/GitLab repository.
2. Import the repository in Vercel.
3. Framework preset: **Vite** (or Other with `npm run build`).
4. Build command: `npm run build`; output directory: `dist`.
5. Deploy. No API keys or server environment variables are needed.

The build generates `index.html`, `studio.html`, `learn.html`, and `docs.html` in `dist`.

## File structure

- `engine.js` — parser / tokenizer / AST interpreter (CommonJS/UMD)
- `workspace.js` — tabs, explorer, imports, autosave, program execution
- `cm-loader.js` — CodeMirror 6 modules and syntax integration
- `academy.js` — learning exercises and automatic output checks
- `samples.js` — runnable example programs and keyword dictionary
- `workspace.css`, `style.css` — monochrome design
- `public/` — static copies of scripts and logo assets for Vite build
- `test.cjs` — runtime regression tests

## Supported grammar

```text
הגדר שם להיות "דניס"
הדפס "שלום " + שם

הגדר ציונים להיות [10, 20]
הוסף(ציונים, 30)

הגדר אדם להיות {שם: "דנה", גיל: 19}
הדפס אדם.שם

ייבא "math.ivrit"
```

Blocks use `אם … אז` / `אחרת` / `סוף`, `כל_עוד … עשה` / `סוף`, and `פונקציה …` / `החזר` / `סוף`. Modules are project-local and run once.

## Known limits

- The language is an **experimental teaching language**, not a production replacement for JavaScript/TypeScript.
- There is no network access, DOM access, real filesystem access or package manager within Ivrit programs.
- Projects and Academy progress are browser-local (`localStorage`); different browsers/devices do not sync.
- True RTL support is limited by browser bidirectional-text behavior, particularly mixed punctuation and numeric fragments. Test Hebrew typing and cursor motion on target browsers.
- This JS interpreter uses step limits and elapsed-time checks, but it runs on the UI thread. Do not run untrusted programs from anonymous users; a production shared execution service needs a worker / isolated execution sandbox.
- Cloud deployment **of Ivrit-generated websites** is not provided; Vercel deploys the Studio web application itself.
- Open the development server with `npm run dev` instead of opening `studio.html` through `file://` (browser module security restrictions). The runtime can fall back to a basic RTL `<textarea>` if the CodeMirror module fails to initialize.

The ZIP is a **source project**. Vercel builds and serves the result from `dist`.
