import { memo } from '@internals/utils'
import type { ast } from '@kubb/ast'
import { parse } from 'yuku'

export type Lang = 'ts' | 'tsx'

// A name in the text that refers to something declared outside it, by its offsets in the text.
type Reference = { name: string; start: number; end: number; shorthand: boolean }
// What one read of a fragment keeps: its free references and every name it declares or uses.
type Analysis = { references: Array<Reference>; names: Array<string> }

// The name of the declaration a fragment is wrapped in. It is left out of the names the fragment uses.
const placeholder = '__kubb'

// A fragment such as `options: Options<Pet>` or `{ body: Pet }` is not a program, so it is parsed inside the code its kind
// stands for. The prefix length is subtracted from every offset.
const contexts: Record<ast.InlineTextKind, [before: string, after: string]> = {
  code: ['', ''],
  type: [`type ${placeholder} = `, ''],
  value: [`const ${placeholder} = (`, ')'],
  parameters: [`function ${placeholder}(`, ') {}'],
  typeParameters: [`function ${placeholder}<`, '>() {}'],
}
const kinds = Object.keys(contexts) as Array<ast.InlineTextKind>

// The same fragment is read several times while one file is inlined.
const analyses = memo.create<string, Analysis>({ max: 1000 })

// Reads `text` as `kind`, or, when that fails or no kind is given, as the first kind it parses as without errors.
function analyze(text: string, lang: Lang, kind: ast.InlineTextKind | undefined): Analysis {
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

function parseAs(text: string, lang: Lang, kind: ast.InlineTextKind): { analysis: Analysis; clean: boolean } {
  const [before, after] = contexts[kind]
  const file = parse(before + text + after, { lang, sourceType: 'module', analyze: true })
  const references = file.references
    .filter((reference) => !reference.binding && reference.node.type !== 'JSXIdentifier')
    .map((reference): Reference => {
      const parent = file.parentOf(reference.node)
      const shorthand = parent?.type === 'Property' && parent.shorthand
      return { name: reference.name, start: reference.node.start - before.length, end: reference.node.end - before.length, shorthand }
    })
  const names = [...file.bindings.map((binding) => binding.name), ...file.references.map((reference) => reference.name)].filter((name) => name !== placeholder)
  return { analysis: { references, names }, clean: !file.diagnostics.some((diagnostic) => diagnostic.severity === 'error') }
}

/**
 * Calls `replace` for every name in `text` that refers to something declared outside it, and swaps in what it returns.
 * Bound names (parameters, type parameters, locals), keys, members, strings, comments and JSX tag names are left alone. A
 * shorthand property `{ x }` keeps its key, so it becomes `{ x: replacement }`.
 */
export function replaceIdentifiers(text: string, replace: (name: string) => string | undefined, lang: Lang = 'ts', kind?: ast.InlineTextKind): string {
  let out = ''
  let last = 0

  for (const { name, start, end, shorthand } of analyze(text, lang, kind).references) {
    const replacement = replace(name)
    if (replacement === undefined) continue
    out += text.slice(last, start) + (shorthand ? `${name}: ${replacement}` : replacement)
    last = end
  }

  return out + text.slice(last)
}

function createInline(lang: Lang): ast.InlineLanguage {
  return {
    replaceIdentifiers: (text, replace, kind) => replaceIdentifiers(text, replace, lang, kind),
    names: (text, kind) => analyze(text, lang, kind).names,
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
