export { dedent, indent, unquote } from '@internals/utils'

// A raw line break would end the literal.
const quoteEscapes = new Map([
  ['\\', '\\\\'],
  ["'", "\\'"],
  ['\n', '\\n'],
  ['\r', '\\r'],
])

const identifierPattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

// JavaScript and Java reserved words and common globals, from https://github.com/jonschlinkert/reserved.
const reservedWords: ReadonlySet<string> = new Set([
  'abstract',
  'arguments',
  'await',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'double',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'final',
  'finally',
  'float',
  'for',
  'function',
  'goto',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'int',
  'interface',
  'let',
  'long',
  'native',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'volatile',
  'while',
  'with',
  'yield',
  'Array',
  'Date',
  'hasOwnProperty',
  'Infinity',
  'isFinite',
  'isNaN',
  'isPrototypeOf',
  'length',
  'Math',
  'name',
  'NaN',
  'Number',
  'Object',
  'prototype',
  'String',
  'toString',
  'undefined',
  'valueOf',
])

/** A single-quoted JavaScript string literal, with backslashes, quotes and line breaks escaped. */
export function string(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return "''"
  return `'${Array.from(String(value), (char) => quoteEscapes.get(char) ?? char).join('')}'`
}

/** Whether `name` can be used as a variable name: identifier characters and not a reserved word. */
export function isIdentifier(name: string): boolean {
  return Boolean(name) && !reservedWords.has(name) && identifierPattern.test(name)
}

/** An object key, quoted only when it is not identifier-shaped. Reserved words such as `class` stay bare. */
export function key(name: string): string {
  return identifierPattern.test(name) ? name : string(name)
}

/** A JSON value as a JavaScript literal, with single-quoted strings and keys quoted only when needed. */
export function literal(value: unknown): string {
  if (typeof value === 'string') return string(value)
  if (Array.isArray(value)) return `[${value.map(literal).join(', ')}]`
  if (value && typeof value === 'object') {
    return `{ ${Object.entries(value)
      .map(([name, item]) => `${key(name)}: ${literal(item)}`)
      .join(', ')} }`
  }
  return String(value)
}

/** Text that is safe inside a JSDoc block: an `@` at the start of a line is escaped, so it cannot start a tag. */
export function jsDoc(text: unknown): string {
  return `${text}`.replace(/^(\s*)@/gm, '$1\\@')
}
