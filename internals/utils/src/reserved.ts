/**
 * JavaScript and Java reserved words.
 * @link https://github.com/jonschlinkert/reserved/blob/master/index.js
 */
const reservedWords = [
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
]

/**
 * Prefixes a word with `_` when it is a reserved JavaScript/Java identifier
 * or starts with a digit.
 */
export function transformReservedWord(word: string): string {
  if (word && (reservedWords.includes(word) || (word[0]! >= '0' && word[0]! <= '9'))) {
    return `_${word}`
  }
  return word
}

/**
 * Returns `true` when `name` is a syntactically valid JavaScript variable name.
 */
export function isValidVarName(name: string): boolean {
  try {
    Function(`var ${name}`)
  } catch {
    return false
  }
  return true
}
