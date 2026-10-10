import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { Hookable } from '../Hookable.ts'
import type { KubbHooks, KubbHookEndContext, KubbHookStartContext } from '../types.ts'
import { runHook } from './runHook.ts'

const node = process.execPath

describe('runHook', () => {
  it('returns success and announces the command when it exits 0', async () => {
    const hooks = new Hookable<KubbHooks>()
    const starts: Array<KubbHookStartContext> = []
    const ends: Array<KubbHookEndContext> = []
    hooks.hook('kubb:hook:start', (ctx) => {
      starts.push(ctx)
    })
    hooks.hook('kubb:hook:end', (ctx) => {
      ends.push(ctx)
    })

    const result = await runHook({ hooks, id: 'ok', command: node, args: ['-e', 'process.exit(0)'], name: 'types' })

    expect(result).toStrictEqual({ success: true, error: null })
    expect(starts).toStrictEqual([{ id: 'ok', command: node, name: 'types', args: ['-e', 'process.exit(0)'] }])
    expect(ends).toStrictEqual([{ id: 'ok', command: node, name: 'types', args: ['-e', 'process.exit(0)'], success: true, error: null }])
  })

  it('returns the captured output and success=false when the command exits non-zero', async () => {
    const hooks = new Hookable<KubbHooks>()
    const ends: Array<KubbHookEndContext> = []
    hooks.hook('kubb:hook:end', (ctx) => {
      ends.push(ctx)
    })

    const result = await runHook({
      hooks,
      id: 'fail',
      command: node,
      args: ['-e', 'process.stdout.write("out"); process.stderr.write("boom"); process.exit(1)'],
    })

    expect(result.success).toBe(false)
    expect(result.error?.message).toBe(`Hook execute failed: ${node} -e process.stdout.write("out"); process.stderr.write("boom"); process.exit(1)`)
    expect(result.stdout).toBe('out')
    expect(result.stderr).toBe('boom')
    expect(ends[0]?.success).toBe(false)
    expect(ends[0]?.stderr).toBe('boom')
  })

  it('returns the spawn error when the executable does not exist', async () => {
    const hooks = new Hookable<KubbHooks>()

    const result = await runHook({ hooks, command: 'kubb-no-such-tool-for-tests' })

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('ENOENT')
  })

  it('streams each stdout line through kubb:hook:line when a listener is attached', async () => {
    const hooks = new Hookable<KubbHooks>()
    const lines: Array<string> = []
    hooks.hook('kubb:hook:line', ({ id, line }) => {
      lines.push(`${id}:${line}`)
    })

    const result = await runHook({ hooks, id: 'lines', command: node, args: ['-e', 'console.log("first"); console.log("second"); process.exit(1)'] })

    expect(lines).toStrictEqual(['lines:first', 'lines:second'])
    expect(result.success).toBe(false)
  })

  it('returns success=false when a kubb:hook:line listener throws', async () => {
    const hooks = new Hookable<KubbHooks>()
    hooks.hook('kubb:hook:line', () => {
      throw new Error('listener failed')
    })

    const result = await runHook({ hooks, command: node, args: ['-e', 'console.log("first"); process.exit(0)'] })

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('kubb:hook:line')
  })

  it('runs the command in the given working directory', async () => {
    const hooks = new Hookable<KubbHooks>()
    const lines: Array<string> = []
    hooks.hook('kubb:hook:line', ({ line }) => {
      lines.push(line)
    })

    await runHook({ hooks, command: node, args: ['-e', 'console.log(process.cwd())'], cwd: process.cwd() })

    expect(lines).toStrictEqual([process.cwd()])
  })
})
