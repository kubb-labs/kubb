import { mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSerialRunner, fetchUrlBody, isNewerVersion, startUrlWatcher, startWatcher } from './utils.ts'

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

describe('startWatcher', () => {
  let dir: string
  const stops: Array<() => void> = []

  afterEach(async () => {
    for (const stop of stops.splice(0)) stop()
    if (dir) await rm(dir, { recursive: true, force: true })
  })

  it('debounces a burst of saves into one build and names the change', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-watch-'))
    const file = join(dir, 'petstore.yaml')
    await writeFile(file, 'openapi: 3.1.0\n')
    const builds: Array<Array<string>> = []
    const messages: Array<string> = []

    stops.push(
      startWatcher(
        [file],
        async (paths) => {
          builds.push(paths)
        },
        { info: (message) => messages.push(message), error: (message) => messages.push(message) },
      ),
    )
    // The watch starts asynchronously; give it a moment before the first write.
    await new Promise((resolve) => setTimeout(resolve, 50))

    await writeFile(file, 'openapi: 3.1.0\ninfo: {}\n')
    // An atomic save: write a temporary file and move it over the watched one.
    await writeFile(join(dir, 'petstore.yaml.tmp'), 'openapi: 3.1.0\ninfo: { title: pets }\n')
    await rename(join(dir, 'petstore.yaml.tmp'), file)

    await vi.waitFor(() => expect(builds).toHaveLength(1), { timeout: 2_000 })
    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(builds).toStrictEqual([[file]])
    expect(messages.length).toBeGreaterThan(0)
    expect(messages.every((message) => message.includes(`Change detected: change ${file}`))).toBe(true)
  })

  it('ignores other files in the directory', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-watch-'))
    const file = join(dir, 'petstore.yaml')
    await writeFile(file, 'openapi: 3.1.0\n')
    const builds: Array<Array<string>> = []

    stops.push(
      startWatcher(
        [file],
        async (paths) => {
          builds.push(paths)
        },
        { info: () => {}, error: () => {} },
      ),
    )
    await new Promise((resolve) => setTimeout(resolve, 50))

    await writeFile(join(dir, 'other.yaml'), 'openapi: 3.1.0\n')
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(builds).toStrictEqual([])
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
