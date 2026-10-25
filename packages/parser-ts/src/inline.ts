import type { ast } from '@kubb/ast'
import { parse, type TokenList, TokenKind } from 'yuku-parser'

// A name followed by `:` or `?:` right after one of these is a key or parameter name (`{ Name: x }`, `(Name: x)`).
const keyStarts = new Set<number>([TokenKind.LeftBrace, TokenKind.Comma, TokenKind.Semicolon, TokenKind.LeftParen])

/**
 * Calls `replace` for every identifier that references something, and swaps in what it returns.
 * yuku's tokens leave out strings, comments and template text; member access (`x.Name`) and keys are skipped here.
 */
export function replaceIdentifiers(text: string, replace: (name: string) => string | undefined, lang: 'ts' | 'tsx' = 'ts'): string {
  // Generated fragments such as `options: Options<Pet>` are not whole programs; yuku still tokenizes them.
  const tokens = parse(text, { lang, sourceType: 'module', tokens: true }).tokens!
  let out = ''
  let last = 0
  for (let i = 0; i < tokens.length; i++) {
    const replacement = tokens.kind(i) === TokenKind.Identifier && isReference(tokens, i) ? replace(tokens.text(i)) : undefined
    if (replacement === undefined) continue
    out += text.slice(last, tokens.start(i)) + replacement
    last = tokens.end(i)
  }
  return out + text.slice(last)
}

function isReference(tokens: TokenList, i: number): boolean {
  const kind = (index: number): number | undefined => (index >= 0 && index < tokens.length ? tokens.kind(index) : undefined)
  const previous = kind(i - 1)
  if (previous === TokenKind.Dot || previous === TokenKind.OptionalChaining) return false
  const isKey = kind(i + 1) === TokenKind.Colon || (kind(i + 1) === TokenKind.Question && kind(i + 2) === TokenKind.Colon)
  // `? Name :` in a conditional type is a reference.
  return !(isKey && (previous === undefined || tokens.newlineBefore(i) || keyStarts.has(previous)))
}

function createInline(lang: 'ts' | 'tsx'): ast.InlineLanguage {
  return {
    replaceIdentifiers: (text, replace) => replaceIdentifiers(text, replace, lang),
    wrap: (expression) => (/^[\w$.]+$/.test(expression) ? expression : `(${expression})`),
  }
}

/**
 * Inline support for TypeScript and JavaScript files: identifiers are found with {@link replaceIdentifiers},
 * and a definition that is more than a name or a dotted path goes in parentheses.
 */
export const inlineTs = createInline('ts')

/**
 * {@link inlineTs} for `.tsx` and `.jsx` files, where JSX text and attribute names are not identifiers.
 */
export const inlineTsx = createInline('tsx')
