import { camelCase, pascalCase, screamingSnakeCase, snakeCase } from './casing.ts'
import { escape, jsStringEscape } from './escape.ts'
import { stringify, stringifyObject } from './stringify.ts'
import { toRegExpString } from './toRegExp.ts'
import { isValidVarName, transformReservedWord } from './transformReservedWord.ts'
import { trim, trimQuotes } from './trim.ts'

export { camelCase, pascalCase, screamingSnakeCase, snakeCase } from './casing.ts'
export { escape, jsStringEscape } from './escape.ts'
export { stringify, stringifyObject } from './stringify.ts'
export { toRegExpString } from './toRegExp.ts'
export { isValidVarName, transformReservedWord } from './transformReservedWord.ts'
export { trim, trimQuotes } from './trim.ts'

export default {
  escape,
  jsStringEscape,
  transformReservedWord,
  isValidVarName,
  stringify,
  stringifyObject,
  toRegExpString,
  trim,
  trimQuotes,
  camelCase,
  pascalCase,
  snakeCase,
  screamingSnakeCase,
} as const
