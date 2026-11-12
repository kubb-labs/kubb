import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ast } from '@kubb/ast'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FileManager } from '../FileManager.ts'
import { Hookable } from '../Hookable.ts'
import type { KubbHooks } from '../types.ts'
import { fsStorage } from './fsStorage.ts'
import { createFsWorkers, getFsWorkers } from './fsWorkers.ts'

function makeFile(path: string, text: string) {
  return ast.factory.createFile({
    path,
    baseName: path.split('/').pop() as `${string}.${string}`,
    sources: [ast.factory.createSource({ nodes: [ast.factory.createText(text)] })],
    imports: [],
    exports: [],
  })
}

describe('fsWorkers', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'kubb-fs-workers-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('writes into missing directories and exits once idle', async () => {
    const workers = createFsWorkers({ size: 2, idleMs: 10 })
    const path = join(dir, 'a', 'b', 'c.ts')

    await Promise.all([workers.write(path, 'const c = 1\n'), workers.write(join(dir, 'd.ts'), 'const d = 1\n')])

    expect(readFileSync(path, 'utf8')).toBe('const c = 1\n')
    expect(workers.size).toBe(2)
    await vi.waitFor(() => expect(workers.size).toBe(0))
  })

  it('rejects a failed write with the error of that file only', async () => {
    const workers = createFsWorkers({ size: 1, idleMs: 10 })
    writeFileSync(join(dir, 'blocker'), '')
    const broken = join(dir, 'blocker', 'x.ts')
    const fine = join(dir, 'fine.ts')

    const [failed, written] = await Promise.allSettled([workers.write(broken, 'x'), workers.write(fine, 'y')])

    expect(failed).toMatchObject({ status: 'rejected', reason: { code: 'ENOTDIR', path: broken } })
    expect(written.status).toBe('fulfilled')
    expect(readFileSync(fine, 'utf8')).toBe('y')
    workers.close()
  })

  it('rejects jobs still in flight when closed', async () => {
    const workers = createFsWorkers({ size: 1 })
    const pending = workers.write(join(dir, 'late.ts'), 'late')
    workers.close()

    await expect(pending).rejects.toThrow('fsStorage worker closed')
    expect(workers.size).toBe(0)
  })

  it('surfaces a write error through FileManager for the file that failed', async () => {
    writeFileSync(join(dir, 'blocker'), '')
    const files = [makeFile(join(dir, 'ok.ts'), 'const ok = 1'), makeFile(join(dir, 'blocker', 'bad.ts'), 'const bad = 1')]

    await expect(new FileManager().write(files, { storage: fsStorage() })).rejects.toMatchObject({ code: 'ENOTDIR', path: join(dir, 'blocker', 'bad.ts') })
  })

  it('reports what the file held before the write on kubb:file:processed', async () => {
    const path = join(dir, 'a.ts')
    writeFileSync(path, 'const a = 1\n')
    const hooks = new Hookable<KubbHooks>()
    const stored: Array<string | null> = []
    hooks.hook('kubb:file:processed', (ctx) => {
      stored.push(ctx.stored ?? null)
    })

    await new FileManager().write([makeFile(path, 'const a = 2'), makeFile(join(dir, 'b.ts'), 'const b = 1')], { storage: fsStorage(), hooks })

    expect(stored).toStrictEqual(['const a = 1\n', null])
    expect(readFileSync(path, 'utf8')).toBe('const a = 2\n')
  })

  it('stops writing on abort and lets the shared workers exit', async () => {
    const controller = new AbortController()
    const files = Array.from({ length: 200 }, (_, index) => makeFile(join(dir, `f${index}.ts`), `const f${index} = 1`))
    const hooks = new Hookable<KubbHooks>()
    hooks.hook('kubb:file:processed', () => controller.abort())

    await expect(new FileManager().write(files, { storage: fsStorage(), signal: controller.signal, hooks })).rejects.toThrow()
    await vi.waitFor(() => expect(getFsWorkers().size).toBe(0), { timeout: 5000 })
  })
})
