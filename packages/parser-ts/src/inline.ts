import { memo } from '@internals/utils'
import type { InlineTextKind } from './nodeText.ts'
import { parse } from 'yuku'

export type Lang = 'ts' | 'tsx'

// A name in the text that refers to something declared outside it, by its offsets in the text.
// `shorthand` is `{ x }`, and `exported` is `export { x }`, where a new name has to keep the old one as the key or export name.
type Reference = { name: string; start: number; end: number; shorthand: boolean; exported: boolean }
// What one read of a fragment keeps: its free references and every name it declares or uses.
type Analysis = { references: Array<Reference>; names: Array<string> }

// The name of the declaration a fragment is wrapped in. It is left out of the names the fragment uses.
const placeholder = '__kubb'

// A fragment such as `options: Options<Pet>` or `{ body: Pet }` is not a program, so it is parsed inside the code its kind
// stands for. The prefix length is subtracted from every offset, and each wrapper closes on its own line so a trailing `//`
// comment cannot swallow it.
const contexts: Record<InlineTextKind, [before: string, after: string]> = {
  code: ['', ''],
  type: [`type ${placeholder} = `, ''],
  value: [`const ${placeholder} = (`, '\n)'],
  parameters: [`function ${placeholder}(`, '\n) {}'],
  typeParameters: [`function ${placeholder}<`, '\n>() {}'],
}
const kinds = Object.keys(contexts) as Array<InlineTextKind>

// The same fragment is read several times while one file is inlined.
const analyses = memo.create<string, Analysis>({ max: 1000 })

// Reads `text` as `kind`, or, when that fails or no kind is given, as the first kind it parses as without errors.
function analyze(text: string, lang: Lang, kind: InlineTextKind | undefined): Analysis {
  return memo(analyses, `${lang}\0${kind ?? ''}\0${text}`, () => {
    const first = kind ?? 'code'
    const fallback = parseAs(text, lang, first)
    if (fallback.clean) return fallback.analysis
    for (const candidate of kinds.filter((item) => item !== first)) {
      const parsed = parseAs(text, lang, candidate)
      if (parsed.clean) return parsed.analysis
    }
    return fallback.analysis
  })
}

function parseAs(text: string, lang: Lang, kind: InlineTextKind): { analysis: Analysis; clean: boolean } {
  const [before, after] = contexts[kind]
  const file = parse(before + text + after, { lang, sourceType: 'module', analyze: true })
  const references = file.references
    .filter((reference) => !reference.binding && reference.node.type !== 'JSXIdentifier')
    .map((reference): Reference => {
      const parent = file.parentOf(reference.node)
      const shorthand = parent?.type === 'Property' && parent.shorthand
      const exported = parent?.type === 'ExportSpecifier' && parent.exported.start === parent.local.start
      return { name: reference.name, start: reference.node.start - before.length, end: reference.node.end - before.length, shorthand, exported }
    })
  const names = [...file.bindings.map((binding) => binding.name), ...file.references.map((reference) => reference.name)].filter((name) => name !== placeholder)
  return { analysis: { references, names }, clean: !file.diagnostics.some((diagnostic) => diagnostic.severity === 'error') }
}

/**
 * Calls `replace` for every name in `text` that refers to something declared outside it, and swaps in what it returns.
 * Bound names (parameters, type parameters, locals), keys, members, strings, comments and JSX tag names are left alone. A
 * shorthand property `{ x }` keeps its key, so it becomes `{ x: replacement }`, and `export { x }` keeps its export name.
 */
export function replaceIdentifiers(text: string, replace: (name: string) => string | undefined, lang: Lang = 'ts', kind?: InlineTextKind): string {
  let out = ''
  let last = 0

  for (const { name, start, end, shorthand, exported } of analyze(text, lang, kind).references) {
    const replacement = replace(name)
    if (replacement === undefined) continue
    out += text.slice(last, start) + (shorthand ? `${name}: ${replacement}` : exported ? `${replacement} as ${name}` : replacement)
    last = end
  }

  return out + text.slice(last)
}

/**
 * The free names in `text`, in order, the same ones `replaceIdentifiers` would offer to replace.
 */
export function referencesIn(text: string, lang: Lang, kind: InlineTextKind): Array<string> {
  return analyze(text, lang, kind).references.map((reference) => reference.name)
}

/**
 * Every name `text` declares or uses, so a declaration added next to it never shadows one.
 */
export function namesIn(text: string, lang: Lang, kind: InlineTextKind): Array<string> {
  return analyze(text, lang, kind).names
}

/**
 * Makes `expression` safe to put where a name was: a name or dotted path stays bare, and anything else goes in parentheses.
 */
export function wrap(expression: string): string {
  return /^[\w$.]+$/.test(expression) ? expression : `(${expression})`
}
