import { createInput, createSchema, createStreamInput } from '@kubb/ast'
import type { InputStreamNode } from '@kubb/ast'
import { describe, expect, it, vi } from 'vitest'
import { createMockedAdapter } from '../mocks.ts'
import { Parse } from './Parse.ts'

async function* asyncFrom<T>(items: Array<T>): AsyncGenerator<T> {
  for (const item of items) yield item
}

describe('Parse.input', () => {
  it('uses adapter.stream when available and reports mode "stream"', async () => {
    const streamed: InputStreamNode = createStreamInput(asyncFrom([createSchema({ type: 'string', name: 'Pet' })]), asyncFrom([]))
    const stream = vi.fn(async () => streamed)
    const adapter = createMockedAdapter()
    adapter.stream = stream as never

    const result = await Parse.input({ adapter, source: { type: 'data', data: '' } })

    expect(stream).toHaveBeenCalledOnce()
    expect(result.mode).toBe('stream')
    expect(result.schemaCount).toBeNull()
    expect(result.operationCount).toBeNull()
    expect(result.inputNode).toBe(streamed)
  })

  it('falls back to adapter.parse and wraps it as a stream when stream is absent', async () => {
    const parsed = createInput({ schemas: [createSchema({ type: 'string', name: 'Pet' })] })
    const parse = vi.fn(async () => parsed)
    const adapter = createMockedAdapter({ parse })

    const result = await Parse.input({ adapter, source: { type: 'data', data: '' } })

    expect(parse).toHaveBeenCalledOnce()
    expect(result.mode).toBe('parse')
    expect(result.schemaCount).toBe(1)
    expect(result.operationCount).toBe(0)

    const collected: Array<string> = []
    for await (const schema of result.inputNode.schemas) collected.push(schema.name ?? '')
    expect(collected).toStrictEqual(['Pet'])
  })
})

describe('Parse.document', () => {
  it('returns the eager InputNode from adapter.parse', async () => {
    const parsed = createInput({ schemas: [createSchema({ type: 'string', name: 'Pet' })] })
    const parse = vi.fn(async () => parsed)
    const adapter = createMockedAdapter({ parse })

    const result = await Parse.document({ adapter, source: { type: 'data', data: '' } })

    expect(parse).toHaveBeenCalledOnce()
    expect(result).toBe(parsed)
  })
})
