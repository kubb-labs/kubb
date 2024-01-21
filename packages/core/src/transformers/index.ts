import { camelCase, pascalCase, pathCase } from './casing.ts'
import { combineCodes } from './combineCodes.ts'
import { createJSDocBlockText } from './createJSDocBlockText.ts'
import { escape, jsStringEscape } from './escape.ts'
import { createIndent } from './indent.ts'
import { nameSorter } from './nameSorter.ts'
import { searchAndReplace } from './searchAndReplace.ts'
import { transformReservedWord } from './transformReservedWord.ts'
import { trim, trimExtName } from './trim.ts'

export { camelCase, pascalCase, pathCase } from './casing.ts'
export { combineCodes } from './combineCodes.ts'
export { createJSDocBlockText } from './createJSDocBlockText.ts'
export { escape, jsStringEscape } from './escape.ts'
export { createIndent } from './indent.ts'
export { nameSorter } from './nameSorter.ts'
export { searchAndReplace } from './searchAndReplace.ts'
export { transformReservedWord } from './transformReservedWord.ts'
export { trim, trimExtName } from './trim.ts'

export default {
  combineCodes,
  escape,
  jsStringEscape,
  createIndent,
  transformReservedWord,
  nameSorter,
  searchAndReplace,
  trim,
  trimExtName,
  JSDoc: {
    createJSDocBlockText,
  },
  camelCase,
  pascalCase,
  pathCase,
} as const
