import type { ast } from '@kubb/ast'

const IDENTIFIER = /[A-Za-z_$][\w$]*/y

/**
 * Calls `replace` for every identifier that references something, and swaps in what it returns.
 * Strings, comments, member access (`x.Name`) and object keys (`{ Name: 1 }`) are left alone.
 *
 * shortcut: a regex literal is scanned as code, so a quote inside one can hide the identifiers after it; parse with TypeScript if generated code starts mixing regex literals with inline names.
 */
export function replaceIdentifiers(text: string, replace: (name: string) => string | undefined): string {
  let out = ''
  let i = 0
  // `true` for a `${` inside a template literal, `false` for a plain `{`, so each `}` knows whether the template resumes.
  const braces: Array<boolean> = []
  const copy = (end: number) => {
    out += text.slice(i, end)
    i = end
  }
  const template = () => {
    while (i < text.length) {
      if (text[i] === '\\') copy(i + 2)
      else if (text[i] === '`') return copy(i + 1)
      else if (text[i] === '$' && text[i + 1] === '{') {
        braces.push(true)
        return copy(i + 2)
      } else copy(i + 1)
    }
  }

  while (i < text.length) {
    const char = text[i]!
    const next = text[i + 1]
    if (char === '/' && next === '/') {
      const end = text.indexOf('\n', i)
      copy(end === -1 ? text.length : end)
    } else if (char === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2)
      copy(end === -1 ? text.length : end + 2)
    } else if (char === '"' || char === "'") {
      let end = i + 1
      while (end < text.length && text[end] !== char) end += text[end] === '\\' ? 2 : 1
      copy(end + 1)
    } else if (char === '`') {
      copy(i + 1)
      template()
    } else if (char === '{') {
      braces.push(false)
      copy(i + 1)
    } else if (char === '}') {
      copy(i + 1)
      if (braces.pop()) template()
    } else if (char >= '0' && char <= '9') {
      // A number such as `1e5` or `0x1F`: its letters are not identifiers.
      let end = i + 1
      while (end < text.length && /[\w$.]/.test(text[end]!)) end++
      copy(end)
    } else {
      IDENTIFIER.lastIndex = i
      const name = IDENTIFIER.exec(text)?.[0]
      if (!name) {
        copy(i + 1)
        continue
      }
      const end = i + name.length
      out += (isReference(text, i, end) ? replace(name) : undefined) ?? name
      i = end
    }
  }
  return out
}

function isReference(text: string, start: number, end: number): boolean {
  let before = start - 1
  while (before >= 0 && (text[before] === ' ' || text[before] === '\t')) before--
  const previous = before < 0 ? '\n' : text[before]!
  // Member access `x.Name` or `x?.Name`, but not a spread `...Name`.
  if (previous === '.' && text[before - 1] !== '.') return false

  let after = end
  while (after < text.length && (text[after] === ' ' || text[after] === '\t')) after++
  const isKey = text[after] === ':' || (text[after] === '?' && text[after + 1] === ':')
  // A key or parameter name (`{ Name: x }`, `(Name: x)`); `? Name :` in a conditional type is a reference.
  return !(isKey && '{,;(\n\r'.includes(previous))
}

/**
 * Inline support for TypeScript and JavaScript files: identifiers are found with {@link replaceIdentifiers},
 * and a definition that is more than a name or a dotted path goes in parentheses.
 */
export const inlineTs: ast.InlineLanguage = {
  replaceIdentifiers,
  wrap: (expression) => (/^[\w$.]+$/.test(expression) ? expression : `(${expression})`),
}
