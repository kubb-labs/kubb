import type { HighlighterCore } from 'shiki/core'

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  json: 'json',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
}

/**
 * Maps a file's extension to a shiki grammar id, falling back to `text` (a hard-coded shiki
 * bypass needing no grammar) rather than guessing at one this highlighter doesn't carry.
 */
export function languageFor(baseName: string): string {
  const extension = baseName.split('.').pop() ?? ''
  return LANGUAGE_BY_EXTENSION[extension] ?? 'text'
}

let highlighter: Promise<HighlighterCore> | null = null

/**
 * A hand-picked grammar and theme set, not shiki's `bundle/web` — Kubb only ever generates
 * TS, JS, JSON, Markdown, and YAML, and the full web bundle ships every language shiki knows
 * as its own chunk. The JS regex engine skips a wasm grammar engine entirely, which this set
 * of grammars doesn't need.
 *
 * Every import here is dynamic, so shiki only downloads once the Files panel is actually
 * opened — the Pipeline and AST tabs, the default view, never pay for it.
 */
function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, light, dark, typescript, tsx, javascript, jsx, json, markdown, yaml] = await Promise.all(
      [
        import('shiki/core'),
        import('shiki/engine/javascript'),
        import('shiki/themes/github-light.mjs'),
        import('shiki/themes/github-dark.mjs'),
        import('shiki/langs/typescript.mjs'),
        import('shiki/langs/tsx.mjs'),
        import('shiki/langs/javascript.mjs'),
        import('shiki/langs/jsx.mjs'),
        import('shiki/langs/json.mjs'),
        import('shiki/langs/markdown.mjs'),
        import('shiki/langs/yaml.mjs'),
      ],
    )

    return createHighlighterCore({
      themes: [light.default, dark.default],
      langs: [typescript.default, tsx.default, javascript.default, jsx.default, json.default, markdown.default, yaml.default],
      engine: createJavaScriptRegexEngine(),
    })
  })()

  return highlighter
}

/**
 * Renders `code` as theme-aware syntax-highlighted HTML, matching `baseName`'s extension to a
 * grammar. Same light/dark pairing `kubb-labs/platform` uses for its own code panels, so the
 * output tracks the app's `.dark` toggle via `--shiki-dark` the same way.
 */
export async function highlight(code: string, baseName: string): Promise<string> {
  const core = await getHighlighter()
  return core.codeToHtml(code, {
    lang: languageFor(baseName),
    themes: { light: 'github-light', dark: 'github-dark' },
  })
}
