import type { Oas } from '@kubb/oas'
import { createOasParser as _createOasParser } from './parser.ts'
import type { OasParser, OasParserOptions } from './parser.ts'

export { adapterOas, adapterOasName } from './adapter.ts'
export type { OasParser } from './parser.ts'

/**
 * Creates an OAS parser bound to the given `Oas` instance.
 * Accepts the `Oas` class from `@kubb/oas`.
 */
export function createOasParser(oas: Oas, options?: OasParserOptions): OasParser {
  return _createOasParser(oas as never, options)
}
