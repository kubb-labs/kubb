import { print } from './print.ts'

import type ts from 'typescript'

type ParseResult = {
  ast: ts.Node
  text: string
}

export function parse(ast: ts.Node): ParseResult {
  return {
    ast,
    text: print(ast),
  }
}
