import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { afterEach, describe, expect, it } from 'vitest'
import { Hookable } from '../Hookable.ts'
import type { KubbHooks, KubbHookEndContext, KubbHookStartContext } from '../types.ts'
import { binDirectories, runHook, toWindowsCommandLine } from './runHook.ts'

const node = process.execPath

describe('runHook', () => {
  const roots: Array<string> = []
  afterEach(() => {
    for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true })
  })

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

  it('returns the spawn error promptly when the executable does not exist', async () => {
    const hooks = new Hookable<KubbHooks>()
    const started = Date.now()

    const result = await runHook({ hooks, command: 'kubb-no-such-tool-for-tests' })

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('ENOENT')
    expect(Date.now() - started).toBeLessThan(2_000)
  })

  it('returns the abort error within the grace period when the child ignores SIGTERM', async () => {
    const hooks = new Hookable<KubbHooks>()
    const controller = new AbortController()
    const started = Date.now()
    setTimeout(() => controller.abort(), 200)

    const result = await runHook({
      hooks,
      command: node,
      args: ['-e', 'process.on("SIGTERM", () => {}); setTimeout(() => {}, 10_000)'],
      signal: controller.signal,
    })

    expect(result.success).toBe(false)
    expect(result.error?.name).toBe('AbortError')
    expect(Date.now() - started).toBeLessThan(5_000)
  }, 10_000)

  it('streams each stdout and stderr line through kubb:hook:line when a listener is attached', async () => {
    const hooks = new Hookable<KubbHooks>()
    const lines: Array<string> = []
    hooks.hook('kubb:hook:line', ({ id, line }) => {
      lines.push(`${id}:${line}`)
    })

    const result = await runHook({ hooks, id: 'lines', command: node, args: ['-e', 'console.log("first"); console.error("second"); process.exit(1)'] })

    expect([...lines].sort()).toStrictEqual(['lines:first', 'lines:second'])
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

  it.skipIf(process.platform === 'win32')('finds a tool that only exists in node_modules/.bin above the working directory', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kubb-hook-bin-'))
    roots.push(root)
    const binDir = path.join(root, 'node_modules', '.bin')
    const cwd = path.join(root, 'sub')
    fs.mkdirSync(binDir, { recursive: true })
    fs.mkdirSync(cwd)
    fs.writeFileSync(path.join(binDir, 'kubb-local-tool-for-tests'), '#!/bin/sh\necho local\n', { mode: 0o755 })
    const hooks = new Hookable<KubbHooks>()
    const lines: Array<string> = []
    hooks.hook('kubb:hook:line', ({ line }) => {
      lines.push(line)
    })

    const result = await runHook({ hooks, command: 'kubb-local-tool-for-tests', cwd })

    expect(result).toStrictEqual({ success: true, error: null })
    expect(lines).toStrictEqual(['local'])
  })
})

describe('binDirectories', () => {
  it('returns one node_modules/.bin per directory from cwd up to the root', () => {
    const dirs = binDirectories(path.join(path.parse(process.cwd()).root, 'a', 'b'))

    expect(dirs).toStrictEqual([
      path.join(path.parse(process.cwd()).root, 'a', 'b', 'node_modules', '.bin'),
      path.join(path.parse(process.cwd()).root, 'a', 'node_modules', '.bin'),
      path.join(path.parse(process.cwd()).root, 'node_modules', '.bin'),
    ])
  })
})

describe('toWindowsCommandLine', () => {
  it('returns the command bare and each argument quoted', () => {
    expect(toWindowsCommandLine('prettier', ['--write', 'src/gen'])).toBe('prettier ^"--write^" ^"src/gen^"')
  })

  it('returns a quoted argument when it contains a space', () => {
    expect(toWindowsCommandLine('npm', ['run', 'gen types'])).toBe('npm ^"run^" ^"gen types^"')
  })

  it('returns backslash-escaped inner quotes with cmd metacharacters carets', () => {
    expect(toWindowsCommandLine('echo', ['say "hi"'])).toBe('echo ^"say \\^"hi\\^"^"')
  })

  it('returns doubled backslashes before an inner quote and at the end', () => {
    expect(toWindowsCommandLine('echo', ['C:\\dir\\', 'a\\"b'])).toBe('echo ^"C:\\dir\\\\^" ^"a\\\\\\^"b^"')
  })

  it('returns caret-prefixed percent and ampersand', () => {
    expect(toWindowsCommandLine('echo', ['100%', 'a&b'])).toBe('echo ^"100^%^" ^"a^&b^"')
  })

  it('returns a quoted command when its path contains a space', () => {
    expect(toWindowsCommandLine('C:\\Program Files\\nodejs\\node.exe', ['-v'])).toBe('^"C:\\Program Files\\nodejs\\node.exe^" ^"-v^"')
  })
})
