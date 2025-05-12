/**
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
  'eval',
  'function',
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

export function transformReservedWord(word: string): string {
  if ((word && reservedWords.includes(word)) || word?.match(/^\d/)) {
    return `_${word}`
  }

  return word
}

export function isValidVarName(name: string) {
  try {
    Function(`var ${name}`)
  } catch (_e) {
    return false
  }
  return true
}
