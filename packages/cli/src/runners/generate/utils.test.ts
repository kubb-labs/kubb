import process from 'node:process'
import { AsyncEventEmitter, type KubbHooks } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { isNewerVersion, runHook } from './utils.ts'

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

  it('streams output as kubb:hook:line and still ends with success=false when a streamed hook fails', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const lines: Array<string> = []
    let end: { success: boolean } | undefined
    hooks.on('kubb:hook:line', ({ line }) => {
      lines.push(line)
    })
    hooks.on('kubb:hook:end', (ctx) => {
      end = ctx
    })

    await runHook({
      id: 'd',
      command: node,
      args: ['-e', 'console.log("streamed"); process.exit(1)'],
      commandWithArgs: 'node',
      hooks,
    })

    expect(lines).toContain('streamed')
    expect(end?.success).toBe(false)
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

  it('returns success=true with no error when the command exits 0', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()

    const result = await runHook({
      id: 'e',
      command: node,
      args: ['-e', 'console.log("noop")'],
      commandWithArgs: 'node',
      hooks,
    })

    expect(result).toStrictEqual({ success: true, error: null })
  })

  it('returns success=false with the error and captured output on a non-zero exit', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()

    const result = await runHook({
      id: 'f',
      command: node,
      args: ['-e', 'process.stdout.write("out"); process.stderr.write("boom"); process.exit(1)'],
      commandWithArgs: 'node',
      hooks,
    })

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('Hook execute failed')
    expect(result.stdout).toContain('out')
    expect(result.stderr).toContain('boom')
  })
})

describe('isNewerVersion', () => {
  it('returns true when the latest minor is double-digit', () => {
    expect(isNewerVersion('5.9.0', '5.10.0')).toBe(true)
  })

  it('returns false when the versions are equal', () => {
    expect(isNewerVersion('5.9.0', '5.9.0')).toBe(false)
  })

  it('returns false when the latest version is older', () => {
    expect(isNewerVersion('5.10.0', '5.9.9')).toBe(false)
  })

  it('ignores prerelease suffixes when comparing', () => {
    expect(isNewerVersion('5.9.0-beta.1', '5.9.1')).toBe(true)
  })

  it('returns false for a malformed latest version', () => {
    expect(isNewerVersion('5.9.0', 'not-a-version')).toBe(false)
  })
})
