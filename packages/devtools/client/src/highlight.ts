import type { HighlighterCore } from '@shikijs/core'

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
 * A hand-picked grammar and theme set, imported from the scoped `@shikijs/*` packages rather
 * than the umbrella `shiki` package. `shiki` unconditionally depends on
 * `@shikijs/engine-oniguruma` (and its wasm-grammar-compiler chain) even though this highlighter
 * only ever uses the JS regex engine, so depending on it would install that whole tree for
 * nothing — `@shikijs/core` + `@shikijs/engine-javascript` don't carry it.
 *
 * `@shikijs/langs` and `@shikijs/themes` are each a single package bundling every language and
 * theme shiki knows — using one grammar or all of them costs the same on disk, so the language
 * list here is chosen for the browser chunk it produces, not for install size.
 *
 * Every import here is dynamic, so shiki only downloads once the Files panel is actually
 * opened — the Pipeline and AST tabs, the default view, never pay for it.
 */
function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, light, dark, typescript, tsx, javascript, jsx, json, markdown, yaml] = await Promise.all(
      [
        import('@shikijs/core'),
        import('@shikijs/engine-javascript'),
        import('@shikijs/themes/github-light'),
        import('@shikijs/themes/github-dark'),
        import('@shikijs/langs/typescript'),
        import('@shikijs/langs/tsx'),
        import('@shikijs/langs/javascript'),
        import('@shikijs/langs/jsx'),
        import('@shikijs/langs/json'),
        import('@shikijs/langs/markdown'),
        import('@shikijs/langs/yaml'),
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
