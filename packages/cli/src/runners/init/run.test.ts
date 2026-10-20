import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { DryRunExtension } from '@gunshi/plugin-dryrun'
import * as clack from '@clack/prompts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registryEntry, registryIndex, stubFetch } from '../../utils/registryFixture.ts'
import { installPackages } from './utils.ts'
import { run } from './run.ts'

vi.mock('./utils.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./utils.ts')>()),
  installPackages: vi.fn(async () => {}),
}))
vi.mock('@clack/prompts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@clack/prompts')>()),
  select: vi.fn(),
  multiselect: vi.fn(),
  text: vi.fn(),
  confirm: vi.fn(async () => true),
}))

const official = (name: string, exportName: string) => ({
  ...registryEntry({ name, version: '1.0.0', manifest: { export: exportName } }),
  id: `kubb-labs/${name}`,
})
const index = registryIndex([official('plugin-ts', 'pluginTs'), official('plugin-zod', 'pluginZod')])

// Stand-ins for the `@gunshi/plugin-dryrun` extension: one runs each task, the other returns its dry-run fallback
const wrap = ((fn: unknown) => fn) as DryRunExtension['wrap']
const off: DryRunExtension = { enabled: false, run: ((task: () => unknown) => task()) as DryRunExtension['run'], wrap }
const on: DryRunExtension = {
  enabled: true,
  run: ((_task: unknown, options?: { resolve?: () => unknown }) => options?.resolve?.()) as DryRunExtension['run'],
  wrap,
}

let cwd: string
let output: Array<string>

beforeEach(async () => {
  cwd = await mkdtemp(path.join(tmpdir(), 'kubb-init-run-'))
  await writeFile(path.join(cwd, 'package.json'), JSON.stringify({ name: 'app' }))
  await writeFile(path.join(cwd, 'openapi.yaml'), 'openapi: 3.1.0\npaths: {}\n')
  vi.spyOn(process, 'cwd').mockReturnValue(cwd)
  output = []
  for (const method of ['log', 'warn', 'error'] as const) vi.spyOn(console, method).mockImplementation((...args) => void output.push(args.join(' ')))
  process.exitCode = undefined
  stubFetch({ body: index })
})

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.mocked(installPackages).mockClear()
  vi.mocked(clack.confirm).mockClear()
  process.exitCode = undefined
  await rm(cwd, { recursive: true, force: true })
})

describe('kubb init', () => {
  it('overwrites an existing config after confirmation', async () => {
    await writeFile(path.join(cwd, 'kubb.config.ts'), '// Old config\nexport default {}\n')

    await run({ yes: false, input: './openapi.yaml', output: './gen', plugins: 'ts', dryRun: off })

    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toContain('plugins: [pluginTs()]')
    expect(installPackages).toHaveBeenCalledOnce()
    expect(clack.confirm).toHaveBeenCalledWith(expect.objectContaining({ initialValue: false }))
  })

  it('asks nothing with --yes and flags, and keeps the setup when the first run fails', async () => {
    await run({ yes: true, input: './openapi.yaml', plugins: 'ts,zod', output: 'src/api', dryRun: off })

    expect(installPackages).toHaveBeenCalledWith(
      [expect.stringMatching(/^kubb@/), '@acme/kubb-plugin-ts@1.0.0', '@acme/kubb-plugin-zod@1.0.0'],
      expect.objectContaining({ name: 'npm' }),
      cwd,
    )
    const config = await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')
    expect(config).toContain(`path: 'src/api'`)
    expect(config).toContain('plugins: [pluginTs(), pluginZod()]')
    expect(JSON.parse(await readFile(path.join(cwd, 'package.json'), 'utf8')).scripts).toStrictEqual({ generate: 'kubb generate' })
    expect(output.slice(0, 2)).toStrictEqual([
      expect.stringContaining('Installed kubb @acme/kubb-plugin-ts @acme/kubb-plugin-zod with npm'),
      expect.stringContaining('Wrote kubb.config.ts'),
    ])
    expect(output.at(-1)).toBe('Kubb is set up, but the first run failed. Fix the error, then run npm run generate.')
    expect(vi.mocked(clack.select)).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })

  it('uses the found spec and writes nothing in a dry run', async () => {
    await run({ yes: true, dryRun: on })

    expect(installPackages).not.toHaveBeenCalled()
    await expect(readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).rejects.toThrow()
    expect(output.at(-1)).toBe('Kubb is set up. Run npm run generate after changing the spec.')
    expect(process.exitCode).toBeUndefined()
  })

  it('goes back to the choices when the review asks to change one', async () => {
    vi.mocked(clack.select)
      .mockResolvedValueOnce('./openapi.yaml')
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce('./openapi.yaml')
      .mockResolvedValueOnce(true)
    vi.mocked(clack.multiselect).mockResolvedValueOnce(['kubb-labs/plugin-zod']).mockResolvedValueOnce(['kubb-labs/plugin-ts', 'kubb-labs/plugin-zod'])
    vi.mocked(clack.text).mockResolvedValue('./src/gen')

    await run({ yes: false, dryRun: on })

    const reviews = output.filter((line) => line.includes('plugins: ['))
    expect(reviews).toHaveLength(2)
    expect(reviews[0]).toContain('plugins: [pluginZod()]')
    expect(reviews[1]).toContain('plugins: [pluginTs(), pluginZod()]')
    expect(vi.mocked(clack.multiselect).mock.calls[0]![0].initialValues).toStrictEqual(['kubb-labs/plugin-ts'])
    expect(vi.mocked(clack.multiselect).mock.calls[1]![0].initialValues).toStrictEqual(['kubb-labs/plugin-zod'])
  })
})
