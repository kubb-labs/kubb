import { memo } from '@internals/utils'
import type { ast } from '@kubb/ast'
import { parse } from 'yuku'

type Lang = 'ts' | 'tsx'
type Analysis = { file: ReturnType<typeof parse>; offset: number }

// A fragment such as `options: Options<Pet>` or `{ body: Pet }` is not a program, so it is parsed inside the code its kind
// stands for. The prefix length is subtracted from every offset.
const contexts: Record<ast.InlineTextKind, [before: string, after: string]> = {
  code: ['', ''],
  type: ['type __kubb = ', ''],
  value: ['const __kubb = (', ')'],
  parameters: ['function __kubb(', ') {}'],
  typeParameters: ['function __kubb<', '>() {}'],
}
const kinds = Object.keys(contexts) as Array<ast.InlineTextKind>

// The same fragment is read several times while one file is inlined.
const analyses = memo.create<string, Analysis>({ max: 1000 })

// Parses `text` as `kind`, or, when that fails or no kind is given, as the first kind it parses as without errors.
function analyze(text: string, lang: Lang, kind: ast.InlineTextKind | undefined): Analysis {
  return memo(analyses, `${lang}\0${kind ?? ''}\0${text}`, () => {
    const first = kind ?? 'code'
    const fallback = parseAs(text, lang, first)
    if (isClean(fallback)) return fallback
    for (const candidate of kinds) {
      const analysis = candidate === first ? undefined : parseAs(text, lang, candidate)
      if (analysis && isClean(analysis)) return analysis
    }
    return fallback
  })
}

function parseAs(text: string, lang: Lang, kind: ast.InlineTextKind): Analysis {
  const [before, after] = contexts[kind]
  return { file: parse(before + text + after, { lang, sourceType: 'module', analyze: true }), offset: before.length }
}

function isClean({ file }: Analysis): boolean {
  return !file.diagnostics.some((diagnostic) => diagnostic.severity === 'error')
}

/**
 * Calls `replace` for every name in `text` that refers to something declared outside it, and swaps in what it returns.
 * Bound names (parameters, type parameters, locals), keys, members, strings, comments and JSX tag names are left alone. A
 * shorthand property `{ x }` keeps its key, so it becomes `{ x: replacement }`.
 */
export function replaceIdentifiers(text: string, replace: (name: string) => string | undefined, lang: 'ts' | 'tsx' = 'ts', kind?: ast.InlineTextKind): string {
  const { file, offset } = analyze(text, lang, kind)
  let out = ''
  let last = 0

  for (const reference of file.references) {
    if (reference.binding || reference.node.type === 'JSXIdentifier') continue
    const start = reference.node.start - offset
    const end = reference.node.end - offset
    if (start < last || end > text.length) continue

    const replacement = replace(reference.name)
    if (replacement === undefined) continue
    const parent = file.parentOf(reference.node)
    const shorthand = parent?.type === 'Property' && parent.shorthand
    out += text.slice(last, start) + (shorthand ? `${reference.name}: ${replacement}` : replacement)
    last = end
  }

  return out + text.slice(last)
}

// Every name `text` declares or uses, so a name added next to it never shadows one of them.
function names(text: string, lang: Lang = 'ts', kind?: ast.InlineTextKind): Array<string> {
  const { file } = analyze(text, lang, kind)
  return [...file.bindings.map((binding) => binding.name), ...file.references.map((reference) => reference.name)].filter((name) => name !== '__kubb')
}

function createInline(lang: Lang): ast.InlineLanguage {
  return {
    replaceIdentifiers: (text, replace, kind) => replaceIdentifiers(text, replace, lang, kind),
    names: (text, kind) => names(text, lang, kind),
    wrap: (expression) => (/^[\w$.]+$/.test(expression) ? expression : `(${expression})`),
  }
}

/**
 * Inline support for TypeScript and JavaScript files: references are found with {@link replaceIdentifiers}, and a
 * definition that is more than a name or a dotted path goes in parentheses.
 */
export const inlineTs = createInline('ts')

/**
 * {@link inlineTs} for `.tsx` and `.jsx` files.
 */
export const inlineTsx = createInline('tsx')
