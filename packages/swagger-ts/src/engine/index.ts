/* eslint-disable @typescript-eslint/ban-types */
import type { Prettify } from '@kubb/core'

import type { Parser } from './parser.ts'
import type { Tokenize } from './tokenizer.ts'

export type Engine = {
  debug: {
    parser: true
    ast: false
  }
}

/**
 * 🚧 Unstable API, not ready for production.
 * Thanks to https://github.com/saltyaom/mobius?tab=readme-ov-file
 * @link https://github.com/saltyaom/mobius
 * @link https://github.com/dotansimha/graphql-typed-ast/blob/master/src/utils.ts
 * @link https://github.com/anuraghazra/typelevel-parser/blob/main/parser.ts
 * @link https://github.com/codemix/ts-sql/blob/master/src/Schema.ts
 */
export type CreateEngine<TInput extends string> = Parser<Tokenize<TInput>> extends infer Typed
  ? {
      schema: Prettify<TInput>
      json: Prettify<Typed>
      ast: Tokenize<TInput>
    }
  : never

//TODO create a type that can create a YAML syntax to TS/JSON object => easier to work with

export function createEngine<TInput extends string = '', TDefs extends CreateEngine<TInput> = CreateEngine<TInput>>(input: TInput, options: {} = {}): TDefs {
  return {
    schema: input,
  } as TDefs
}

export default createEngine
