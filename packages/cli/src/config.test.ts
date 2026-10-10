import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getConfigs } from './config.ts'

describe('getConfigs', () => {
  let dir: string

  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true })
  })

  /** Writes a config module that records the given name, so a test can tell which file was loaded. */
  async function writeConfig(file: string, name: string = file): Promise<string> {
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, `export default { name: ${JSON.stringify(name)}, root: '.', input: './pets.yaml', output: { path: './gen' } }\n`)
    return file
  }

  it('loads an explicit ESM config path and defaults plugins to an empty array', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cfg-'))
    const configPath = await writeConfig(join(dir, 'kubb.config.mjs'))

    const { configPath: resolved, configs } = await getConfigs({ configPath })

    expect(resolved).toBe(configPath)
    expect(configs).toHaveLength(1)
    expect(configs[0]?.plugins).toStrictEqual([])
  })

  it('resolves an explicit relative path against cwd', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cfg-'))
    const configPath = await writeConfig(join(dir, 'custom.config.mjs'))

    using _cwd = vi.spyOn(process, 'cwd').mockReturnValue(dir)

    await expect(getConfigs({ configPath: './custom.config.mjs' })).resolves.toMatchObject({ configPath })
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

    using _cwd = vi.spyOn(process, 'cwd').mockReturnValue(dir)

    await expect(getConfigs({ configPath: join(dir, 'missing.config.ts') })).rejects.toThrow(/Config/)
    await expect(getConfigs({})).rejects.toThrow('Config not defined')
  })

  it('wraps a config that fails to load', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cfg-'))
    const configPath = join(dir, 'kubb.config.mjs')
    await writeFile(configPath, `throw new Error('boom')\n`)

    await expect(getConfigs({ configPath })).rejects.toThrow('Config failed loading')
  })

  it.each([
    { file: 'kubb.config.mjs', label: 'kubb.config in cwd' },
    { file: '.kubbrc.mjs', label: '.kubbrc in cwd' },
    { file: '.config/kubb.config.mjs', label: 'kubb.config in .config/' },
    { file: '.config/.kubbrc.mjs', label: '.kubbrc in .config/' },
    { file: 'configs/kubb.config.mjs', label: 'kubb.config in configs/' },
    { file: 'configs/.kubbrc.mjs', label: '.kubbrc in configs/' },
  ])('finds $label', async ({ file }) => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cfg-'))
    const configPath = await writeConfig(join(dir, file))
    using _cwd = vi.spyOn(process, 'cwd').mockReturnValue(dir)

    await expect(getConfigs({})).resolves.toMatchObject({ configPath })
  })

  it.each(['ts', 'mts', 'cts', 'js', 'mjs', 'cjs'])('finds kubb.config.%s', async (extension) => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cfg-'))
    const configPath = join(dir, `kubb.config.${extension}`)
    await mkdir(dir, { recursive: true })
    await writeFile(
      configPath,
      extension.endsWith('ts') || extension === 'mjs' || extension === 'js' ? `export default { root: '.' }\n` : `module.exports = { root: '.' }\n`,
    )
    using _cwd = vi.spyOn(process, 'cwd').mockReturnValue(dir)

    await expect(getConfigs({})).resolves.toMatchObject({ configPath })
  })

  it('walks up to a parent directory', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cfg-'))
    const configPath = await writeConfig(join(dir, 'kubb.config.mjs'))
    const cwd = join(dir, 'packages', 'api')
    await mkdir(cwd, { recursive: true })
    using _cwd = vi.spyOn(process, 'cwd').mockReturnValue(cwd)

    await expect(getConfigs({})).resolves.toMatchObject({ configPath })
  })

  it('prefers the nearest directory, then .kubbrc over kubb.config, then the extension order', async () => {
    dir = await mkdtemp(join(tmpdir(), 'kubb-cfg-'))
    const cwd = join(dir, 'packages', 'api')
    await writeConfig(join(dir, '.kubbrc.ts'), 'parent')
    const nearest = await writeConfig(join(cwd, 'configs', 'kubb.config.mjs'), 'nearest')
    using _cwd = vi.spyOn(process, 'cwd').mockReturnValue(cwd)

    await expect(getConfigs({})).resolves.toMatchObject({ configPath: nearest, configs: [{ name: 'nearest' }] })

    const rc = await writeConfig(join(cwd, '.kubbrc.cjs'), 'rc')
    await writeConfig(join(cwd, 'kubb.config.ts'), 'config')
    await expect(getConfigs({})).resolves.toMatchObject({ configPath: rc })

    const ts = await writeConfig(join(cwd, '.kubbrc.ts'), 'ts')
    await expect(getConfigs({})).resolves.toMatchObject({ configPath: ts })
  })
})
