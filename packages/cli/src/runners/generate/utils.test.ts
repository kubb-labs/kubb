import process from 'node:process'
import { AsyncEventEmitter } from '@internals/utils'
import type { KubbHooks } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { runHook } from './utils.ts'

const node = process.execPath

describe('runHook', () => {
  it('emits kubb:hook:line for each stdout line when a listener is attached', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const lines: Array<string> = []
    hooks.on('kubb:hook:line', ({ line }) => {
      lines.push(line)
    })

    await runHook({
      id: 'a',
      command: node,
      args: ['-e', 'console.log("first"); console.log("second")'],
      commandWithArgs: 'node',
      hooks,
    })

    expect(lines).toContain('first')
    expect(lines).toContain('second')
  })

  it('emits kubb:hook:end with captured stdout/stderr and success=false on a non-zero exit', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    let end: { success: boolean; stdout?: string; stderr?: string } | undefined
    hooks.on('kubb:hook:end', (ctx) => {
      end = ctx
    })

    await runHook({
      id: 'b',
      command: node,
      args: ['-e', 'process.stdout.write("out"); process.stderr.write("boom"); process.exit(1)'],
      commandWithArgs: 'node',
      hooks,
    })

    expect(end?.success).toBe(false)
    expect(end?.stdout).toContain('out')
    expect(end?.stderr).toContain('boom')
  })

  it('completes without streaming when no kubb:hook:line listener is attached', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    let succeeded = false
    hooks.on('kubb:hook:end', ({ success }) => {
      succeeded = success
    })

    await runHook({
      id: 'c',
      command: node,
      args: ['-e', 'console.log("noop")'],
      commandWithArgs: 'node',
      hooks,
    })

    expect(succeeded).toBe(true)
  })
})
