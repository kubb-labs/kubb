/**
 * JavaScript and Java reserved words.
 * @link https://github.com/jonschlinkert/reserved/blob/master/index.js
 */
const reservedWords = new Set([
  'abstract',
  'arguments',
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
] as const)

/**
 * Prefixes `word` with `_` when it is a reserved JavaScript/Java identifier or starts with a digit.
 *
 * @example
 * ```ts
 * transformReservedWord('class')  // '_class'
 * transformReservedWord('42foo')  // '_42foo'
 * transformReservedWord('status') // 'status'
 * ```
 */
export function transformReservedWord(word: string): string {
  const firstChar = word.charCodeAt(0)
  if (word && (reservedWords.has(word as 'valueOf') || (firstChar >= 48 && firstChar <= 57))) {
    return `_${word}`
  }
  return word
}

/**
 * Returns `true` when `name` is a syntactically valid JavaScript variable name.
 *
 * @example
 * ```ts
 * isValidVarName('status')  // true
 * isValidVarName('class')   // false (reserved word)
 * isValidVarName('42foo')   // false (starts with digit)
 * ```
 */
export function isValidVarName(name: string): boolean {
  if (!name || reservedWords.has(name as 'valueOf')) {
    return false
  }
  return isIdentifier(name)
}

/**
 * Returns `name` when it is already a valid JavaScript variable name, otherwise prefixes it with `_`
 * so the result can be used as an identifier. Useful for sanitizing schema names or operation IDs
 * that start with a digit (`409`, `504AccountCancel`) or collide with a reserved word.
 *
 * @example
 * ```ts
 * ensureValidVarName('409')   // '_409'
 * ensureValidVarName('Pet')   // 'Pet'
 * ensureValidVarName('class') // '_class'
 * ```
 */
export function ensureValidVarName(name: string): string {
  if (!name || isValidVarName(name)) {
    return name
  }
  return `_${name}`
}

/**
 * Returns `true` when `name` is syntactically a valid identifier, ignoring reserved words.
 *
 * Reserved words and globals (`class`, `name`, `Date`, …) are valid as bare object-literal keys
 * even though they are not valid variable names, so use this (not {@link isValidVarName}) when
 * deciding whether an object key needs quoting.
 *
 * @example
 * ```ts
 * isIdentifier('name')   // true
 * isIdentifier('x-total')// false
 * ```
 */
export function isIdentifier(name: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)
}
