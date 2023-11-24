import { camelCase, pascalCase } from './casing.ts'
import { combineCodes } from './combineCodes.ts'
import { createJSDocBlockText } from './createJSDocBlockText.ts'
import { escape, jsStringEscape } from './escape.ts'
import { createIndent } from './indent.ts'
import { nameSorter } from './nameSorter.ts'
import { searchAndReplace } from './searchAndReplace.ts'
import { transformReservedWord } from './transformReservedWord.ts'
import { trim, trimExtName } from './trim.ts'

export const transformers = {
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
} as const
