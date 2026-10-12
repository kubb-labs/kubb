import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { run, validateManifest } from './build.ts'

const fixtures = path.join(import.meta.dirname, '__fixtures__')

describe('kubb extension build', () => {
  let outDir: string

  beforeEach(async () => {
    outDir = await mkdtemp(path.join(os.tmpdir(), 'kubb-extension-'))
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(async () => {
    process.exitCode = undefined
    vi.restoreAllMocks()
    await rm(outDir, { recursive: true, force: true })
  })

  it.each(['zod-schema', 'ts-interface'])('writes the manifest of the %s fixture', async (fixture) => {
    const out = path.join(outDir, 'kubb.json')

    const status = await run({ cwd: path.join(fixtures, fixture), entry: 'src/index.ts', out, check: false })

    expect(status).toBe('written')
    await expect(await readFile(out, 'utf8')).toMatchFileSnapshot(`__snapshots__/${fixture}.kubb.json`)
  })

  it('passes --check when the manifest is up to date', async () => {
    const options = { cwd: path.join(fixtures, 'ts-interface'), entry: 'src/index.ts', out: path.join(outDir, 'kubb.json') }
    await run({ ...options, check: false })

    expect(await run({ ...options, check: true })).toBe('up-to-date')
    expect(process.exitCode).toBeUndefined()
  })

  it('fails --check when the manifest drifted', async () => {
    const options = { cwd: path.join(fixtures, 'ts-interface'), entry: 'src/index.ts', out: path.join(outDir, 'kubb.json') }
    await run({ ...options, check: false })
    const written = await readFile(options.out, 'utf8')
    await writeFile(options.out, written.replace('"0.4.0"', '"0.3.0"'))

    expect(await run({ ...options, check: true })).toBe('outdated')
    expect(process.exitCode).toBe(1)
    expect(await readFile(options.out, 'utf8')).not.toBe(written)
  })

  it('fails --check when the manifest is missing', async () => {
    const status = await run({ cwd: path.join(fixtures, 'ts-interface'), entry: 'src/index.ts', out: path.join(outDir, 'kubb.json'), check: true })

    expect(status).toBe('missing')
    expect(process.exitCode).toBe(1)
  })
})

describe('validateManifest', () => {
  it('accepts a minimal manifest', () => {
    expect(
      validateManifest({ name: 'kubb-plugin-a', version: '1.0.0', extensions: [{ kind: 'plugin', meta: { name: 'plugin-a' }, options: {} }] }),
    ).toStrictEqual([])
  })

  it('lists each mismatch', () => {
    const manifest = { name: 'kubb-plugin-a', version: '1.0.0', extensions: [{ kind: 'renderer', meta: {}, options: { 'x-kubb-order': 'first' } }] }

    expect(validateManifest(manifest as never)).toStrictEqual([
      '/extensions/0/kind must be equal to one of the allowed values',
      "/extensions/0/meta must have required property 'name'",
      '/extensions/0/options/x-kubb-order must be number',
    ])
  })
})
