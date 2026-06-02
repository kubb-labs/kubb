import { arrayToAsyncIterable } from '@internals/utils'
import type { InputNode, InputStreamNode } from '@kubb/ast'
import { createStreamInput } from '@kubb/ast'
import type { Adapter, AdapterSource } from '../createAdapter.ts'

/**
 * Result of `Parse.input`.
 */
export type ParseResult = {
  /**
   * Streaming view of the adapter document, ready for the transform and generate phases.
   */
  inputNode: InputStreamNode
  /**
   * How the input was produced.
   * - `'stream'` when the adapter exposes `stream()` and the iterables come straight from it.
   * - `'parse'` when the adapter only exposes `parse()` and the eager result was wrapped as a stream.
   */
  mode: 'stream' | 'parse'
  /**
   * Number of schemas in the parsed document. Populated only in `parse` mode, since streaming
   * adapters do not know the count up front.
   */
  schemaCount: number | null
  /**
   * Number of operations in the parsed document. Populated only in `parse` mode.
   */
  operationCount: number | null
}

/**
 * Phase 1 of the pipeline. Runs the adapter over the configured source and returns an
 * `InputStreamNode` ready for the transform and generate phases. Adapters with `stream()` are
 * used directly. Adapters that only expose `parse()` are wrapped so the downstream pipeline
 * stays stream-only.
 */
export class Parse {
  /**
   * Calls `adapter.stream(source)` when available, otherwise calls `adapter.parse(source)` and
   * wraps the result as a stream. The build pipeline always reads through this entry point.
   */
  static async input({ adapter, source }: { adapter: Adapter; source: AdapterSource }): Promise<ParseResult> {
    if (adapter.stream) {
      const inputNode = await adapter.stream(source)
      return { inputNode, mode: 'stream', schemaCount: null, operationCount: null }
    }

    const parsed = await adapter.parse(source)
    const inputNode = createStreamInput(arrayToAsyncIterable(parsed.schemas), arrayToAsyncIterable(parsed.operations), parsed.meta)
    return { inputNode, mode: 'parse', schemaCount: parsed.schemas.length, operationCount: parsed.operations.length }
  }

  /**
   * Eager variant for consumers that need the full graph in one shot, such as the devtools
   * studio panel. Returns whatever `adapter.parse(source)` produces.
   */
  static document({ adapter, source }: { adapter: Adapter; source: AdapterSource }): Promise<InputNode> {
    return Promise.resolve(adapter.parse(source))
  }
}
