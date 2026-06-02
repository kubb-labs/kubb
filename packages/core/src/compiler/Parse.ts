import { arrayToAsyncIterable } from '@internals/utils'
import type { InputNode, InputStreamNode } from '@kubb/ast'
import { createStreamInput } from '@kubb/ast'
import type { Adapter, AdapterSource } from '../createAdapter.ts'

/**
 * Result of `Parse.input`. Discriminated by `mode` so callers narrow into the parse branch
 * before reading `schemaCount` and `operationCount`, which streaming adapters do not know.
 */
export type ParseResult =
  | {
      mode: 'stream'
      /**
       * Streaming view of the adapter document, ready for the transform and generate steps.
       */
      inputNode: InputStreamNode
    }
  | {
      mode: 'parse'
      /**
       * Streaming view of the adapter document, wrapped from the eager parse result.
       */
      inputNode: InputStreamNode
      /**
       * Number of schemas the adapter produced.
       */
      schemaCount: number
      /**
       * Number of operations the adapter produced.
       */
      operationCount: number
    }

/**
 * Runs the adapter over the configured source and returns an `InputStreamNode` ready for the
 * transform and generate steps. Adapters with `stream()` are used directly. Adapters that only
 * expose `parse()` are wrapped so the downstream pipeline stays stream-only.
 */
export class Parse {
  /**
   * Calls `adapter.stream(source)` when available, otherwise calls `adapter.parse(source)` and
   * wraps the result as a stream. The build pipeline always reads through this entry point.
   */
  static async input({ adapter, source }: { adapter: Adapter; source: AdapterSource }): Promise<ParseResult> {
    if (adapter.stream) {
      const inputNode = await adapter.stream(source)

      return { mode: 'stream', inputNode }
    }

    const parsed = await adapter.parse(source)
    const inputNode = createStreamInput(arrayToAsyncIterable(parsed.schemas), arrayToAsyncIterable(parsed.operations), parsed.meta)

    return { mode: 'parse', inputNode, schemaCount: parsed.schemas.length, operationCount: parsed.operations.length }
  }

  /**
   * Eager variant for consumers that need the full graph in one shot, such as the devtools
   * studio panel. Returns whatever `adapter.parse(source)` produces.
   */
  static document({ adapter, source }: { adapter: Adapter; source: AdapterSource }): Promise<InputNode> {
    return Promise.resolve(adapter.parse(source))
  }
}
