import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { getConfigs } from './utils.ts'

describe('getConfigs', () => {
  let dir: string

  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true })
  })

  it('loads an explicit ESM config path and defaults plugins to an empty array', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cfg-'))
    const configPath = join(dir, 'kubb.config.mjs')
    await writeFile(configPath, `export default { root: '.', input: { path: './pets.yaml' }, output: { path: './gen' } }\n`)

    const { configPath: resolved, configs } = await getConfigs({ configPath })

    expect(resolved).toBe(configPath)
    expect(configs).toHaveLength(1)
    expect(configs[0]?.plugins).toStrictEqual([])
  })

  it('calls a config function with the CLI options', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cfg-'))
    const configPath = join(dir, 'kubb.config.mjs')
    await writeFile(configPath, `export default ({ input }) => ({ root: '.', input: { path: input }, output: { path: './gen' } })\n`)

    const { configs } = await getConfigs({ configPath, input: './from-cli.yaml' })

    expect(configs[0]).toMatchObject({ input: { path: './from-cli.yaml' } })
  })

  it('throws a clear error when no config is found', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cfg-'))
    await expect(getConfigs({ configPath: join(dir, 'missing.config.ts') })).rejects.toThrow(/Config/)
  })
})
