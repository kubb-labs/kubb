import { combineCodes } from './combineCodes.ts'
import { escape, jsStringEscape } from './escape.ts'
import { createIndent } from './indent.ts'
import { transformReservedWord } from './transformReservedWord.ts'

export const transformers = {
  combineCodes,
  escape,
  jsStringEscape,
  createIndent,
  transformReservedWord,
} as const
