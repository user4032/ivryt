# Ivrit Studio v0.2

An experimental monochrome landing page and live right-to-left Hebrew programming playground. Designed with an original editorial / fashion-tech visual identity. Includes a standalone pictorial logo, not text.

## Run locally
Open `index.html` in your browser (JavaScript enabled), or use any static HTTP server.

## Deploy to Vercel
Import the folder as a project, with **Framework Preset: Other**, no build command, and output directory left blank. The root `index.html` is served as a static site.

## Features
- Native Hebrew direction code editor (RTL) with syntax highlighting and line numbers.
- Working browser-only interpreter for Hebrew keywords, variables, conditions, loops, functions and math.
- Four examples, console output and errors, Ctrl+Enter to run.
- Local code draft autosave; import/export `.ivrit` source files.
- No server and no code execution via `eval` or external API.

## Disclaimer
Experimental prototype, not a complete general-purpose programming language. The generated visual logo is a raster asset. Typography loads from Google Fonts, with local fallbacks if offline.
