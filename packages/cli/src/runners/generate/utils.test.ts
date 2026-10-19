import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { EventEmitter } from 'node:events'
import { join, relative } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast'
import { type GeneratorContext, Hookable, type KubbHooks, memoryStorage } from '@kubb/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSerialRunner, diffBuilds, formatChange, listenForKeys, planDryRun, readOutputFiles, startUrlWatcher, startWatcher, trackBuild } from './utils.ts'

describe('createSerialRunner', () => {
  it('collapses triggers that land during a run into one rerun, reports its error through onError, and keeps accepting triggers', async () => {
    let calls = 0
    const errors: Array<string> = []
    const gates: Array<() => void> = []
    const runner = createSerialRunner({
      run: () =>
        new Promise<void>((resolve, reject) => {
          calls += 1
          gates.push(calls === 2 ? () => reject(new Error('run exploded')) : resolve)
        }),
      onError: (error) => errors.push(error.message),
    })

    const first = runner()
    void runner()
    void runner()
    expect(calls).toBe(1)

    gates[0]?.()
    await vi.waitFor(() => expect(calls).toBe(2))

    gates[1]?.()
    await first
    expect(errors).toStrictEqual(['run exploded'])

    const third = runner()
    expect(calls).toBe(3)
    gates[2]?.()
    await third
  })
})

describe('startWatcher', () => {
  let dir: string
  const stops: Array<() => Promise<void>> = []

  afterEach(async () => {
    for (const stop of stops.splice(0)) await stop()
    if (dir) await rm(dir, { recursive: true, force: true })
  })

  it('debounces a burst of saves into one build and names the change', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-watch-'))
    const file = join(dir, 'petstore.yaml')
    await writeFile(file, 'openapi: 3.1.0\n')
    const builds: Array<Array<string>> = []
    const messages: Array<string> = []

    stops.push(
      await startWatcher(
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
    expect(messages.every((message) => stripVTControlCharacters(message).endsWith(`${relative(process.cwd(), file)} changed`))).toBe(true)
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

describe('formatChange', () => {
  it('prints the time and what changed', () => {
    expect(stripVTControlCharacters(formatChange({ target: 'petStore.yaml', now: new Date(2026, 0, 1, 14, 2, 11) }))).toBe('14:02:11  petStore.yaml changed')
    expect(stripVTControlCharacters(formatChange({ target: 'petStore.yaml', removed: true, now: new Date(2026, 0, 1, 14, 2, 11) }))).toBe(
      '14:02:11  petStore.yaml removed',
    )
  })
})

describe('trackBuild and diffBuilds', () => {
  const ctx = {} as GeneratorContext
  const file = (path: string, content = 'v1') => ({ path, sources: [content] }) as unknown as FileNode

  async function build(
    hooks: Hookable<KubbHooks>,
    { schemas, operations, files }: { schemas: Array<string>; operations: Array<string>; files: Array<FileNode> },
  ) {
    for (const name of schemas) await hooks.callHook('kubb:generate:schema', { name } as SchemaNode, ctx)
    for (const operationId of operations) await hooks.callHook('kubb:generate:operation', { operationId } as OperationNode, ctx)
    await hooks.callHook('kubb:files:processing:end', { files, unchanged: [] })
  }

  it('reports added and removed names, and each file added, modified or removed since the last build', async () => {
    const hooks = new Hookable<KubbHooks>()
    const tracker = trackBuild(hooks)

    await build(hooks, { schemas: ['Pet', 'Order'], operations: ['getPet'], files: [file('/gen/Pet.ts'), file('/gen/Order.ts'), file('/gen/getPet.ts')] })
    const previous = tracker.take()
    // getPet.ts is regenerated with the same content, as `output.clean` does to every file, so it counts as unchanged.
    await build(hooks, {
      schemas: ['Pet', 'Pet', 'Tag'],
      operations: ['getPet', 'addPet', 'deletePet'],
      files: [file('/gen/Pet.ts', 'v2'), file('/gen/Tag.ts'), file('/gen/getPet.ts')],
    })

    expect(diffBuilds(previous, tracker.take())).toStrictEqual({
      schemas: { added: 1, removed: 1 },
      operations: { added: 2, removed: 0 },
      files: [
        { status: 'M', path: '/gen/Pet.ts' },
        { status: 'A', path: '/gen/Tag.ts' },
        { status: 'D', path: '/gen/Order.ts' },
      ],
      unchanged: 1,
    })
  })
})

describe('listenForKeys', () => {
  function createInput(isTTY: boolean) {
    return Object.assign(new EventEmitter(), {
      isTTY,
      setRawMode: vi.fn(),
      resume: vi.fn(),
      pause: vi.fn(),
      setEncoding: vi.fn(),
    })
  }

  it('ignores a stdin that is not a TTY', () => {
    const input = createInput(false)

    expect(listenForKeys({ rebuild: vi.fn(), quit: vi.fn(), input: input as unknown as NodeJS.ReadStream })).toBeUndefined()
    expect(input.setRawMode).not.toHaveBeenCalled()
  })

  it('rebuilds on r, quits on q or ctrl+c, and restores raw mode before quitting', () => {
    const input = createInput(true)
    const rebuild = vi.fn()
    const quit = vi.fn()
    using _once = vi.spyOn(process, 'once').mockReturnValue(process)

    const arm = listenForKeys({ rebuild, quit, input: input as unknown as NodeJS.ReadStream })
    expect(input.setRawMode).toHaveBeenLastCalledWith(true)

    input.emit('data', 'r')
    expect(rebuild).toHaveBeenCalledOnce()

    input.emit('data', 'q')
    expect(input.setRawMode).toHaveBeenLastCalledWith(false)
    expect(quit).toHaveBeenLastCalledWith(0)

    arm?.()
    input.emit('data', '\u0003')
    expect(quit).toHaveBeenLastCalledWith(130)
  })
})

describe('planDryRun', () => {
  it('keeps the pre-clean baseline and counts empty files without phantom lines', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'kubb-summary-'))
    try {
      const pet = join(dir, 'pet.ts'),
        legacy = join(dir, 'legacy.ts'),
        empty = join(dir, 'empty.ts')
      await writeFile(pet, 'a\nb\n')
      await writeFile(legacy, 'old\nfile\n')
      const previousFiles = await readOutputFiles(dir)
      await rm(legacy)
      await writeFile(pet, 'a\nB\n')
      const storage = memoryStorage()
      await storage.writeItem(pet, 'a\nB\n')
      await storage.writeItem(empty, '')

      expect(await planDryRun({ storage, paths: [pet, empty], outputPath: dir, clean: true, previousFiles })).toStrictEqual({
        files: [
          { status: 'M', path: pet, added: 1, removed: 1 },
          { status: 'A', path: empty, added: 0, removed: 0 },
          { status: 'D', path: legacy, added: 0, removed: 2 },
        ],
        unchanged: 0,
      })
      expect((await planDryRun({ storage, paths: [pet, empty], outputPath: dir, clean: false, previousFiles })).files.some((file) => file.status === 'D')).toBe(
        false,
      )
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('compares each generated file with disk, and lists the files `clean` would delete', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'kubb-dry-run-'))
    try {
      await mkdir(join(dir, 'gen'))
      await writeFile(join(dir, 'gen/pet.ts'), 'a\nb\nc')
      await writeFile(join(dir, 'gen/tag.ts'), 'same')
      await writeFile(join(dir, 'gen/legacy.ts'), 'old')
      const storage = memoryStorage()
      await storage.writeItem(join(dir, 'gen/pet.ts'), 'a\nB\nc\nd')
      await storage.writeItem(join(dir, 'gen/tag.ts'), 'same')
      await storage.writeItem(join(dir, 'gen/toy.ts'), 'new')
      const paths = ['pet.ts', 'tag.ts', 'toy.ts'].map((name) => join(dir, 'gen', name))

      expect(await planDryRun({ storage, paths, outputPath: join(dir, 'gen'), clean: true })).toStrictEqual({
        files: [
          { status: 'M', path: join(dir, 'gen/pet.ts'), added: 2, removed: 1 },
          { status: 'A', path: join(dir, 'gen/toy.ts'), added: 1, removed: 0 },
          { status: 'D', path: join(dir, 'gen/legacy.ts'), added: 0, removed: 1 },
        ],
        unchanged: 1,
      })
      expect((await planDryRun({ storage, paths, outputPath: join(dir, 'gen'), clean: false })).files.map((file) => file.status)).toStrictEqual(['M', 'A'])
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
