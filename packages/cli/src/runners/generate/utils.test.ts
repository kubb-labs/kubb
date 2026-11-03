import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { EventEmitter } from 'node:events'
import { join, relative } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import type { OperationNode, SchemaNode } from '@kubb/ast'
import { type GeneratorContext, Hookable, type KubbHooks, memoryStorage } from '@kubb/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { diffBuilds, diffFile, diffOutput, listenForKeys, readOutputFiles, startWatcher, trackBuild } from './utils.ts'

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

describe('trackBuild and diffBuilds', () => {
  const ctx = {} as GeneratorContext

  async function build(hooks: Hookable<KubbHooks>, { schemas, operations }: { schemas: Array<string>; operations: Array<string> }) {
    for (const name of schemas) await hooks.callHook('kubb:generate:schema', { name } as SchemaNode, ctx)
    for (const operationId of operations) await hooks.callHook('kubb:generate:operation', { operationId } as OperationNode, ctx)
  }

  it('reports the schema and operation names added and removed since the last build', async () => {
    const hooks = new Hookable<KubbHooks>()
    const tracker = trackBuild(hooks)

    await build(hooks, { schemas: ['Pet', 'Order'], operations: ['getPet'] })
    const previous = tracker.take()
    await build(hooks, { schemas: ['Pet', 'Pet', 'Tag'], operations: ['getPet', 'addPet', 'deletePet'] })

    expect(diffBuilds(previous, tracker.take())).toStrictEqual({
      schemas: { added: 1, removed: 1 },
      operations: { added: 2, removed: 0 },
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

describe('diffOutput', () => {
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

      const previousFiles = await readOutputFiles(join(dir, 'gen'))
      expect(await diffOutput({ storage, paths, clean: true, previousFiles })).toStrictEqual({
        files: [
          { status: 'M', path: join(dir, 'gen/pet.ts'), added: 2, removed: 1 },
          { status: 'A', path: join(dir, 'gen/toy.ts'), added: 1, removed: 0 },
          { status: 'D', path: join(dir, 'gen/legacy.ts'), added: 0, removed: 1 },
        ],
        unchanged: 1,
      })
      expect((await diffOutput({ storage, paths, clean: false, previousFiles })).files.map((file) => file.status)).toStrictEqual(['M', 'A'])

      // Changes counted while writing give the same diff without reading the output back.
      const counted = new Map(
        await Promise.all(
          paths.map(async (path) => [path, diffFile({ path, next: (await storage.readItem(path))!, previous: previousFiles.get(path) ?? null })] as const),
        ),
      )
      expect(await diffOutput({ storage: memoryStorage(), paths, clean: true, previousFiles, counted })).toStrictEqual(
        await diffOutput({ storage, paths, clean: true, previousFiles }),
      )
      // A path the writer never reported, such as a blank file the storage skipped, is read back.
      counted.delete(join(dir, 'gen/tag.ts'))
      expect(await diffOutput({ storage, paths, clean: false, previousFiles, counted })).toStrictEqual(
        await diffOutput({ storage, paths, clean: false, previousFiles }),
      )
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
