import {defineConfig} from 'vite';
import {resolve} from 'node:path';
export default defineConfig({
  base:'/',
  build:{outDir:'dist',rollupOptions:{input:{home:resolve('index.html'),studio:resolve('studio.html'),academy:resolve('learn.html'),docs:resolve('docs.html')}}}
});
