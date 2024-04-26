import { orderBy } from 'natural-orderby'
import { merge } from 'remeda'

import { camelCase, pascalCase, pathCase } from './casing.ts'
import { combineCodes } from './combineCodes.ts'
import { createJSDocBlockText } from './createJSDocBlockText.ts'
import { escape, jsStringEscape } from './escape.ts'
import { createIndent } from './indent.ts'
import { nameSorter } from './nameSorter.ts'
import { searchAndReplace } from './searchAndReplace.ts'
import { stringify, stringifyObject } from './stringify.ts'
import { toRegExp, toRegExpString } from './toRegExp.ts'
import { transformReservedWord } from './transformReservedWord.ts'
import { trim, trimExtName, trimQuotes } from './trim.ts'

export { camelCase, pascalCase, pathCase } from './casing.ts'
export { combineCodes } from './combineCodes.ts'
export { createJSDocBlockText } from './createJSDocBlockText.ts'
export { escape, jsStringEscape } from './escape.ts'
export { createIndent } from './indent.ts'
export { nameSorter } from './nameSorter.ts'
export { searchAndReplace } from './searchAndReplace.ts'
export { stringify, stringifyObject } from './stringify.ts'
export { toRegExp, toRegExpString } from './toRegExp.ts'
export { transformReservedWord } from './transformReservedWord.ts'
export { trim, trimExtName, trimQuotes } from './trim.ts'
export { merge } from 'remeda'
export { orderBy } from 'natural-orderby'

export default {
  combineCodes,
  escape,
  jsStringEscape,
  createIndent,
  transformReservedWord,
  nameSorter,
  searchAndReplace,
  stringify,
  stringifyObject,
  toRegExp,
  toRegExpString,
  trim,
  trimQuotes,
  trimExtName,
  JSDoc: {
    createJSDocBlockText,
  },
  orderBy,
  merge,
  camelCase,
  pascalCase,
  pathCase,
} as const
