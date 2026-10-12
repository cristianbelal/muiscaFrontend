/** highlightjs-solidity (CommonJS, sin tipos): registra el lenguaje Solidity en highlight.js. */
declare module 'highlightjs-solidity' {
  import type { HLJSApi } from 'highlight.js';
  const registerSolidity: (hljs: HLJSApi) => void;
  export default registerSolidity;
}
