import { orderBy } from 'natural-orderby'
import { merge } from 'remeda'

import { camelCase, pascalCase, screamingSnakeCase, snakeCase } from './casing.ts'
import { combineCodes } from './combineCodes.ts'
import { createJSDocBlockText } from './createJSDocBlockText.ts'
import { escape, jsStringEscape } from './escape.ts'
import { createIndent } from './indent.ts'
import { nameSorter } from './nameSorter.ts'
import { searchAndReplace } from './searchAndReplace.ts'
import { stringify, stringifyObject } from './stringify.ts'
import { toRegExpString } from './toRegExp.ts'
import { isValidVarName, transformReservedWord } from './transformReservedWord.ts'
import { trim, trimQuotes } from './trim.ts'

export { orderBy } from 'natural-orderby'
export { merge } from 'remeda'
export { camelCase, pascalCase, screamingSnakeCase, snakeCase } from './casing.ts'
export { combineCodes } from './combineCodes.ts'
export { createJSDocBlockText } from './createJSDocBlockText.ts'
export { escape, jsStringEscape } from './escape.ts'
export { createIndent } from './indent.ts'
export { nameSorter } from './nameSorter.ts'
export { searchAndReplace } from './searchAndReplace.ts'
export { stringify, stringifyObject } from './stringify.ts'
export { toRegExpString } from './toRegExp.ts'
export { isValidVarName, transformReservedWord } from './transformReservedWord.ts'
export { trim, trimQuotes } from './trim.ts'

export default {
  combineCodes,
  escape,
  jsStringEscape,
  createIndent,
  transformReservedWord,
  isValidVarName,
  nameSorter,
  searchAndReplace,
  stringify,
  stringifyObject,
  toRegExpString,
  trim,
  trimQuotes,
  JSDoc: {
    createJSDocBlockText,
  },
  orderBy,
  merge,
  camelCase,
  pascalCase,
  snakeCase,
  screamingSnakeCase,
} as const
