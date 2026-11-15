/* Vite bundles one shared CodeMirror 6 dependency graph. */
export {EditorState} from '@codemirror/state';
export {EditorView,lineNumbers,keymap,highlightActiveLine,highlightActiveLineGutter,drawSelection} from '@codemirror/view';
export {history,historyKeymap,defaultKeymap,indentWithTab} from '@codemirror/commands';
export {autocompletion,completionKeymap,closeBrackets,closeBracketsKeymap} from '@codemirror/autocomplete';
export {linter,lintGutter} from '@codemirror/lint';
export {bracketMatching,StreamLanguage,syntaxHighlighting,HighlightStyle} from '@codemirror/language';
export {tags} from '@lezer/highlight';
export {searchKeymap,highlightSelectionMatches} from '@codemirror/search';
