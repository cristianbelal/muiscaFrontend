import type { HLJSApi } from 'highlight.js';

/** Extensión de archivo → lenguaje de highlight.js (los que no estén se muestran sin color). */
const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  sol: 'solidity',
  go: 'go',
  java: 'java',
  xmi: 'xml',
  xml: 'xml',
  ecore: 'xml',
  genmodel: 'xml',
  json: 'json',
};

/** Sobre este tamaño no se colorea: el navegador se volvería lento y no aporta legibilidad. */
const MAX_HIGHLIGHT_CHARS = 200_000;

let loader: Promise<HLJSApi> | null = null;

/** Carga highlight.js y sus lenguajes solo la primera vez que se necesitan (lazy). */
function loadHighlighter(): Promise<HLJSApi> {
  loader ??= Promise.all([
    import('highlight.js/lib/core'),
    import('highlight.js/lib/languages/java'),
    import('highlight.js/lib/languages/go'),
    import('highlight.js/lib/languages/xml'),
    import('highlight.js/lib/languages/json'),
    import('highlightjs-solidity'),
  ]).then(([core, java, go, xml, json, solidity]) => {
    const hljs = core.default;
    hljs.registerLanguage('java', java.default);
    hljs.registerLanguage('go', go.default);
    hljs.registerLanguage('xml', xml.default);
    hljs.registerLanguage('json', json.default);
    solidity.default(hljs);
    return hljs;
  });
  return loader;
}

export function highlightLanguageOf(path: string): string | null {
  const extension = path.split('.').pop()?.toLowerCase() ?? '';
  return LANGUAGE_BY_EXTENSION[extension] ?? null;
}

/**
 * HTML coloreado (highlight.js escapa el contenido, así que es seguro para innerHTML) o null si
 * el archivo no tiene un lenguaje conocido o es demasiado grande.
 */
export async function highlight(path: string, content: string): Promise<string | null> {
  const language = highlightLanguageOf(path);
  if (!language || content.length > MAX_HIGHLIGHT_CHARS) {
    return null;
  }
  try {
    const hljs = await loadHighlighter();
    return hljs.highlight(content, { language, ignoreIllegals: true }).value;
  } catch {
    return null;
  }
}
