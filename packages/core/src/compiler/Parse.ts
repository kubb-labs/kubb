import { arrayToAsyncIterable } from '@internals/utils'
import type { InputNode, InputStreamNode } from '@kubb/ast'
import { createStreamInput } from '@kubb/ast'
import type { Adapter, AdapterSource } from '../createAdapter.ts'

/**
 * Result of `Parse.input`. `mode` distinguishes a native streaming adapter from an eager
 * `parse()` adapter wrapped into the streaming shape; the counts are populated only in the
 * eager case, where they are cheap to read.
 */
export type ParseResult = {
  inputNode: InputStreamNode
  mode: 'stream' | 'parse'
  schemaCount: number | null
  operationCount: number | null
}

/**
 * Phase 1 of the pipeline. Runs the adapter over the configured source and returns an
 * `InputStreamNode` ready for the transform and generate phases. Adapters with `stream()`
 * are used directly; eager-only adapters are wrapped so the downstream pipeline stays
 * stream-only.
 */
export class Parse {
  /**
   * Streaming-aware entry point. Returns the `InputStreamNode` used by the generate phase.
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
   * Eager variant used by consumers that need the full graph at once, such as the devtools
   * studio panel.
   */
  static document({ adapter, source }: { adapter: Adapter; source: AdapterSource }): Promise<InputNode> {
    return Promise.resolve(adapter.parse(source))
  }
}
