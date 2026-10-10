import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { Hookable, type KubbHooks } from '@kubb/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSerialRunner, fetchUrlBody, getConfigs, isNewerVersion, runHook, runPostGenerate, startUrlWatcher } from './utils.ts'

const node = process.execPath

describe('runHook', () => {
  it('streams each stdout line through kubb:hook:line and still ends with success=false when the hook fails', async () => {
    const hooks = new Hookable<KubbHooks>()
    const lines: Array<string> = []
    let end: { success: boolean } | undefined
    hooks.hook('kubb:hook:line', ({ line }) => {
      lines.push(line)
    })
    hooks.hook('kubb:hook:end', (ctx) => {
      end = ctx
    })

    await runHook({
      id: 'a',
      command: node,
      args: ['-e', 'console.log("first"); console.log("second"); process.exit(1)'],
      commandWithArgs: 'node',
      hooks,
    })

    expect(lines).toStrictEqual(['first', 'second'])
    expect(end?.success).toBe(false)
  })

  it('returns success=true with no error and emits kubb:hook:end when the command exits 0 without a line listener', async () => {
    const hooks = new Hookable<KubbHooks>()
    let succeeded = false
    hooks.hook('kubb:hook:end', ({ success }) => {
      succeeded = success
    })

    const result = await runHook({
      id: 'b',
      command: node,
      args: ['-e', 'console.log("noop")'],
      commandWithArgs: 'node',
      hooks,
    })

    expect(result).toStrictEqual({ success: true, error: null })
    expect(succeeded).toBe(true)
  })

  it('returns success=false with the error and captured output, and emits the same on kubb:hook:end, on a non-zero exit', async () => {
    const hooks = new Hookable<KubbHooks>()
    let end: { success: boolean; stdout?: string; stderr?: string } | undefined
    hooks.hook('kubb:hook:end', (ctx) => {
      end = ctx
    })

    const result = await runHook({
      id: 'c',
      command: node,
      args: ['-e', 'process.stdout.write("out"); process.stderr.write("boom"); process.exit(1)'],
      commandWithArgs: 'node',
      hooks,
    })

    expect(result).toMatchObject({ success: false, stdout: expect.stringContaining('out'), stderr: expect.stringContaining('boom') })
    expect(result.error?.message).toContain('Hook execute failed')
    expect(end).toMatchObject({ success: false, stdout: 'out', stderr: 'boom' })
  })
})

describe('runPostGenerate', () => {
  it('runs string and labeled commands in sequence, naming the labeled step on kubb:hook:start', async () => {
    const hooks = new Hookable<KubbHooks>()
    const names: Array<string | undefined> = []
    hooks.hook('kubb:hook:start', ({ name }) => {
      names.push(name)
    })

    const results = await runPostGenerate({
      commands: [`"${node}" -e "process.exit(0)"`, { name: 'types', command: `"${node}" -e "process.exit(0)"` }],
      hooks,
    })

    expect(results.map((result) => result.success)).toStrictEqual([true, true])
    expect(names).toStrictEqual([undefined, 'types'])
  })

  it('reports success=false when a command exits non-zero', async () => {
    const hooks = new Hookable<KubbHooks>()

    const results = await runPostGenerate({
      commands: [`"${node}" -e "process.exit(1)"`],
      hooks,
    })

    expect(results).toHaveLength(1)
    expect(results[0]?.success).toBe(false)
  })
})

describe('isNewerVersion', () => {
  it.each([
    { current: '5.9.0', latest: '5.10.0', expected: true, label: 'the latest minor is double-digit' },
    { current: '5.9.0', latest: '5.9.0', expected: false, label: 'the versions are equal' },
    { current: '5.10.0', latest: '5.9.9', expected: false, label: 'the latest version is older' },
    { current: '5.9.0-beta.1', latest: '5.9.1', expected: true, label: 'the current version has a prerelease suffix' },
    { current: '5.9.0', latest: 'not-a-version', expected: false, label: 'the latest version is malformed' },
  ])('returns $expected when $label', ({ current, latest, expected }) => {
    expect(isNewerVersion(current, latest)).toBe(expected)
  })
})

describe('getConfigs', () => {
  let dir: string

  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true })
  })

  it('loads an explicit ESM config path and defaults plugins to an empty array', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cfg-'))
    const configPath = join(dir, 'kubb.config.mjs')
    await writeFile(configPath, `export default { root: '.', input: './pets.yaml', output: { path: './gen' } }\n`)

    const { configPath: resolved, configs } = await getConfigs({ configPath })

    expect(resolved).toBe(configPath)
    expect(configs).toHaveLength(1)
    expect(configs[0]?.plugins).toStrictEqual([])
  })

  it('calls a config function with the CLI options', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cfg-'))
    const configPath = join(dir, 'kubb.config.mjs')
    await writeFile(configPath, `export default ({ input }) => ({ root: '.', input, output: { path: './gen' } })\n`)

    const { configs } = await getConfigs({ configPath, input: './from-cli.yaml' })

    expect(configs[0]).toMatchObject({ input: './from-cli.yaml' })
  })

  it('throws a clear error when no config is found', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cfg-'))
    await expect(getConfigs({ configPath: join(dir, 'missing.config.ts') })).rejects.toThrow(/Config/)
  })
})

describe('createSerialRunner', () => {
  it('collapses triggers that land during a run into one rerun', async () => {
    let calls = 0
    const gates: Array<() => void> = []
    const runner = createSerialRunner({
      run: () =>
        new Promise<void>((resolve) => {
          calls += 1
          gates.push(resolve)
        }),
      onError: () => {},
    })

    const first = runner()
    void runner()
    void runner()
    void runner()
    expect(calls).toBe(1)

    gates[0]?.()
    await vi.waitFor(() => expect(calls).toBe(2))

    gates[1]?.()
    await first
    expect(calls).toBe(2)
  })

  it('reports a run error through onError and keeps accepting triggers', async () => {
    const errors: Array<string> = []
    let shouldFail = true
    const runner = createSerialRunner({
      run: async () => {
        if (shouldFail) throw new Error('run exploded')
      },
      onError: (error) => errors.push(error.message),
    })

    await runner()
    expect(errors).toStrictEqual(['run exploded'])

    shouldFail = false
    await runner()
    expect(errors).toStrictEqual(['run exploded'])
  })
})

describe('startUrlWatcher', () => {
  const url = 'http://localhost:1234/openapi.json'
  const stops: Array<() => void> = []
  const quiet = { info: (_message: string) => {}, error: (_message: string) => {} }

  /**
   * Feeds the watcher one queued response per poll, repeating the last entry once the queue is
   * drained. A string resolves as the response body; an Error rejects the fetch like an
   * unreachable server does.
   */
  function stubFetchQueue(queue: Array<string | Error>) {
    let polls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const item = queue[Math.min(polls, queue.length - 1)]
        polls += 1
        if (item instanceof Error) throw item
        return { ok: true, status: 200, text: async () => item }
      }),
    )
    return () => polls
  }

  /**
   * Stubs fetch with a request that never settles until its signal aborts, the shape of a server
   * that accepts the connection but never finishes the response.
   */
  function stubHungFetch(onAbort?: () => void) {
    const fetchMock = vi.fn(
      (_input: unknown, init?: { signal?: AbortSignal }) =>
        new Promise<never>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            onAbort?.()
            reject(new Error('aborted'))
          })
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  function watch(cb: (path: Array<string>) => Promise<void>, options: { log?: typeof quiet; initialBody?: string; timeoutMs?: number } = {}) {
    const stop = startUrlWatcher(url, cb, { log: quiet, intervalMs: 5, ...options })
    stops.push(stop)
    return stop
  }

  afterEach(() => {
    for (const stop of stops.splice(0)) stop()
    vi.unstubAllGlobals()
  })

  it('stays quiet while polls match the initial body', async () => {
    const pollCount = stubFetchQueue(['{"openapi":"3.1.0"}'])
    let builds = 0

    watch(
      async () => {
        builds += 1
      },
      { initialBody: '{"openapi":"3.1.0"}' },
    )

    await vi.waitFor(() => expect(pollCount()).toBeGreaterThanOrEqual(3))
    expect(builds).toBe(0)
  })

  it('rebuilds when the response body changes', async () => {
    stubFetchQueue(['v1', 'v1', 'v2'])
    const builtWith: Array<Array<string>> = []

    watch(
      async (paths) => {
        builtWith.push(paths)
      },
      { initialBody: 'v1' },
    )

    await vi.waitFor(() => expect(builtWith).toStrictEqual([[url]]))
  })

  it('rebuilds when the document changed between the initial build and the first poll', async () => {
    stubFetchQueue(['v2'])
    let builds = 0

    watch(
      async () => {
        builds += 1
      },
      { initialBody: 'v1' },
    )

    await vi.waitFor(() => expect(builds).toBe(1))
  })

  it('rebuilds on the first successful poll when no initial body was captured', async () => {
    const down = new Error('fetch failed')
    const pollCount = stubFetchQueue([down, down, 'v1', 'v1'])
    let builds = 0

    watch(async () => {
      builds += 1
    })

    // The server was down at startup, so nothing was generated yet: recovery rebuilds even
    // though the body never changed, and sets the baseline so later polls stay quiet.
    await vi.waitFor(() => expect(builds).toBe(1))
    await vi.waitFor(() => expect(pollCount()).toBeGreaterThanOrEqual(5))
    expect(builds).toBe(1)
  })

  it('reports an outage once and rebuilds after recovery only when the body changed', async () => {
    const down = new Error('fetch failed')
    const pollCount = stubFetchQueue(['v1', down, down, 'v1', 'v2'])
    const errors: Array<string> = []
    let builds = 0

    watch(
      async () => {
        builds += 1
      },
      {
        initialBody: 'v1',
        log: {
          info: (_message: string) => {},
          error: (message: string) => {
            errors.push(message)
          },
        },
      },
    )

    // Recovery with an unchanged body (poll 4) stays quiet; only the real change rebuilds.
    await vi.waitFor(() => expect(builds).toBe(1))
    expect(pollCount()).toBeGreaterThanOrEqual(5)
    expect(errors).toHaveLength(1)
  })

  it('times out a request that never settles and keeps polling', async () => {
    const fetchMock = stubHungFetch()

    watch(async () => {}, { timeoutMs: 10 })

    await vi.waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2))
  })

  it('aborts the in-flight request and stops polling once the returned stop function runs', async () => {
    let aborted = false
    const fetchMock = stubHungFetch(() => {
      aborted = true
    })

    const stop = watch(async () => {}, { timeoutMs: 10_000 })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())
    stop()

    await vi.waitFor(() => expect(aborted).toBe(true))
    const settled = fetchMock.mock.calls.length
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(fetchMock.mock.calls.length).toBe(settled)
  })
})

describe('fetchUrlBody', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the body for a 2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, text: async () => '{"openapi":"3.1.0"}' })),
    )

    await expect(fetchUrlBody('http://localhost:1234/openapi.json')).resolves.toBe('{"openapi":"3.1.0"}')
  })

  it.each([
    { label: 'the response is not 2xx', fetch: async () => ({ ok: false, status: 500, text: async () => 'nope' }) },
    {
      label: 'the request fails',
      fetch: async () => {
        throw new Error('fetch failed')
      },
    },
  ])('returns undefined when $label', async ({ fetch }) => {
    vi.stubGlobal('fetch', vi.fn(fetch))

    await expect(fetchUrlBody('http://localhost:1234/openapi.json')).resolves.toBeUndefined()
  })
})
