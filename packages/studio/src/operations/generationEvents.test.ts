import process from 'node:process'
import { Hookable, type KubbHooks, runHook } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { createGenerationStream } from './generationEvents.ts'

describe('Generation event stream', () => {
  it('serializes an error for a waiting reader and skips core hooks outside the public catalog', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream(hooks, 'job-1')
    const reader = generation.stream.getReader()
    const reading = reader.read()

    await hooks.callHook('kubb:setup:start')
    await hooks.callHook('kubb:error', { error: new Error('broken') })
    await generation.close()

    await expect(reading).resolves.toStrictEqual({
      done: false,
      value: { version: 1, jobId: 'job-1', type: 'kubb:error', data: [{ message: 'broken', stack: expect.any(String) }], timestamp: expect.any(Number) },
    })
    await expect(reader.read()).resolves.toStrictEqual({ done: true, value: undefined })
  })

  it('keeps errors when progress fills the event queue', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream(hooks, 'job-1')

    for (let i = 0; i < 1_025; i++) await hooks.callHook('kubb:info', { message: `step ${i}` })
    await hooks.callHook('kubb:error', { error: new Error('broken') })
    await generation.close()

    const events = await Array.fromAsync(generation.stream)
    expect(events.length).toBeLessThan(1_024)
    expect(events.at(-1)?.type).toBe('kubb:error')
  })

  it('strips terminal styling from messages, which core writes for a console', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream(hooks, 'job-1')

    await hooks.callHook('kubb:success', { message: 'Formatting with \u001b[2mprettier\u001b[22m successfully' })
    await generation.close()

    const events = await Array.fromAsync(generation.stream)
    expect(events[0]?.data.at(0)).toStrictEqual({ message: 'Formatting with prettier successfully', info: undefined })
  })
})

describe('hook events from a command core runs', () => {
  it('publishes hook:start, one hook:line per stdout line and a successful hook:end under one id', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream(hooks, 'job-1')
    const args = ['-e', "console.log('first');console.log('second')"]

    await runHook({ hooks, command: process.execPath, args })
    await generation.close()

    const events = await Array.fromAsync(generation.stream)
    const id = (events[0]?.data.at(0) as { id?: string } | undefined)?.id
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
    expect(events.map((event) => [event.type, event.data.at(0)])).toStrictEqual([
      ['kubb:hook:start', { id, command: process.execPath, args }],
      ['kubb:hook:line', { id, line: 'first' }],
      ['kubb:hook:line', { id, line: 'second' }],
      ['kubb:hook:end', { id, command: process.execPath, args, success: true, error: undefined }],
    ])
  })

  it('reports a non-zero exit on hook:end only, leaving kubb:error off the stream', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream(hooks, 'job-1')
    const args = ['-e', 'process.exit(1)']

    const result = await runHook({ hooks, command: process.execPath, args })
    await generation.close()

    const events = await Array.fromAsync(generation.stream)
    expect(result.success).toBe(false)
    expect(events.map((event) => event.type)).toStrictEqual(['kubb:hook:start', 'kubb:hook:end'])
    expect(events[1]?.data.at(0)).toStrictEqual(
      expect.objectContaining({ success: false, error: { message: `Hook execute failed: ${process.execPath} -e process.exit(1)`, stack: expect.any(String) } }),
    )
  })
})
