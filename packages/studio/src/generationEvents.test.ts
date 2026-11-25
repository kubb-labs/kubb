import process from 'node:process'
import { Hookable, type KubbHooks, runHook } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { createGenerationStream, GenerationStream } from './generationEvents.ts'

describe('Generation event stream', () => {
  it('serializes an error without its stack for a waiting reader and skips core hooks outside the public catalog', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream({ hooks, jobId: 'job-1' })
    const reader = generation.stream.getReader()
    const reading = reader.read()

    await hooks.callHook('kubb:setup:start')
    await hooks.callHook('kubb:error', { error: new Error('broken') })
    await generation.close()

    await expect(reading).resolves.toStrictEqual({
      done: false,
      value: { version: 1, jobId: 'job-1', type: 'kubb:error', data: [{ message: 'broken', stack: undefined }], timestamp: expect.any(Number) },
    })
    await expect(reader.read()).resolves.toStrictEqual({ done: true, value: undefined })
  })

  it('sends error stacks only in debug mode', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = new GenerationStream({ hooks, jobId: 'job-1', debug: true })

    await hooks.callHook('kubb:error', { error: new Error('broken') })
    await generation.close()

    const [event] = await Array.fromAsync(generation.stream)
    expect(event?.data).toStrictEqual([{ message: 'broken', stack: expect.stringContaining('broken') }])
  })

  it.each([
    { debug: false, stack: undefined },
    { debug: true, stack: expect.stringContaining('broken') },
  ])('sends diagnostic and hook error stacks only when debug is $debug', async ({ debug, stack }) => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream({ hooks, jobId: 'job-1', debug })

    await hooks.callHook('kubb:diagnostic', {
      diagnostic: { code: 'KUBB_UNKNOWN', severity: 'error', message: 'broken', cause: new Error('broken') },
    } as unknown as KubbHooks['kubb:diagnostic'][0])
    await hooks.callHook('kubb:hook:end', { id: 'h1', command: 'echo', success: false, error: new Error('broken') } as unknown as KubbHooks['kubb:hook:end'][0])
    await generation.close()

    const events = await Array.fromAsync(generation.stream)
    expect(events.find((event) => event.type === 'kubb:diagnostic')?.data).toMatchObject([{ stack }])
    expect(events.find((event) => event.type === 'kubb:hook:end')?.data).toMatchObject([{ error: { stack } }])
  })

  it('keeps errors when progress fills the event queue', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream({ hooks, jobId: 'job-1' })

    for (let i = 0; i < 1_025; i++) await hooks.callHook('kubb:info', { message: `step ${i}` })
    await hooks.callHook('kubb:error', { error: new Error('broken') })
    await generation.close()

    const events = await Array.fromAsync(generation.stream)
    expect(events.length).toBeLessThan(1_024)
    expect(events.at(-1)?.type).toBe('kubb:error')
  })

  it('lets the event loop run after a step event, so a run busy rendering in memory still sends it', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream({ hooks, jobId: 'job-1' })
    let ticked = false
    setImmediate(() => {
      ticked = true
    })

    await hooks.callHook('kubb:lint:start')
    await generation.close()

    expect(ticked).toBe(true)
  })

  it('strips terminal styling from messages, which core writes for a console', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream({ hooks, jobId: 'job-1' })

    await hooks.callHook('kubb:success', { message: 'Formatting with \u001b[2mprettier\u001b[22m successfully' })
    await generation.close()

    const events = await Array.fromAsync(generation.stream)
    expect(events[0]?.data.at(0)).toStrictEqual({ message: 'Formatting with prettier successfully', info: undefined })
  })
})

describe('hook events from a command core runs', () => {
  it('publishes hook:start, one hook:line per stdout line and a successful hook:end under one id', async () => {
    const hooks = new Hookable<KubbHooks>()
    const generation = createGenerationStream({ hooks, jobId: 'job-1' })
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
})
