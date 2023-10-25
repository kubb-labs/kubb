import { combineCodes } from './combineCodes.ts'
import { createJSDocBlockText } from './createJSDocBlockText.ts'
import { escape, jsStringEscape } from './escape.ts'
import { createIndent } from './indent.ts'
import { nameSorter } from './nameSorter.ts'
import { searchAndReplace } from './searchAndReplace.ts'
import { transformReservedWord } from './transformReservedWord.ts'

export const transformers = {
  combineCodes,
  escape,
  jsStringEscape,
  createIndent,
  transformReservedWord,
  nameSorter,
  searchAndReplace,
  JSDoc: {
    createJSDocBlockText,
  },
} as const
