import { readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import * as clack from '@clack/prompts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createProject, registryEntry, registryIndex, stubFetch } from '../../utils/registryFixture.ts'
import { uninstallPackages } from '../init/utils.ts'
import { run } from './run.ts'
import { extensionKinds } from '@internals/shared'

vi.mock('../init/utils.ts', () => ({
  detectPackageManager: vi.fn(async () => ({ name: 'pnpm', agent: 'pnpm' })),
  uninstallPackages: vi.fn(async () => {}),
}))
vi.mock('@clack/prompts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@clack/prompts')>()),
  confirm: vi.fn(async () => true),
}))

const pluginX = registryEntry({ name: 'plugin-x', version: '1.2.0', manifest: { export: 'pluginX' } })
const pluginY = registryEntry({ name: 'plugin-y', version: '1.0.0', manifest: { export: 'pluginY', dependencies: ['plugin-x'] } })
const parserTs = {
  ...registryEntry({ name: 'parser-ts', version: '5.0.0', kind: extensionKinds.parser, manifest: { export: 'parserTs' } }),
  id: 'kubb-labs/parser-ts',
}
const parserTsArtifact = { ...parserTs, artifact: { ...parserTs.artifact, package: '@kubb/parser-ts' } }
const adapterX = registryEntry({ name: 'adapter-x', version: '1.0.0', kind: extensionKinds.adapter, manifest: { export: 'adapterX' } })

const config = (plugins: string, imports = `import { pluginX } from '@acme/kubb-plugin-x'\n`) =>
  `import { defineConfig } from 'kubb/config'\n${imports}\nexport default defineConfig({\n  input: './petStore.yaml',\n  plugins: [${plugins}],\n})\n`

let cwd: string
let output: Array<string>

beforeEach(async () => {
  cwd = await createProject({ '@acme/kubb-plugin-x': { version: '1.2.0' } })
  await writeFile(path.join(cwd, 'kubb.config.ts'), config('pluginX()'))
  vi.spyOn(process, 'cwd').mockReturnValue(cwd)
  output = []
  for (const method of ['log', 'warn', 'error'] as const)
    vi.spyOn(console, method).mockImplementation((...args) => void output.push(stripVTControlCharacters(args.join(' '))))
  stubFetch({ body: registryIndex([pluginX, pluginY, parserTsArtifact, adapterX]) })
  process.exitCode = undefined
})

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.mocked(uninstallPackages).mockClear()
  vi.mocked(clack.confirm).mockClear()
  process.exitCode = undefined
  await rm(cwd, { recursive: true, force: true })
})

describe('kubb remove', () => {
  it('removes the plugin from the config and uninstalls its package', async () => {
    await run({ id: 'acme/plugin-x', yes: true, uninstall: true })

    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toBe(config('', ''))
    expect(uninstallPackages).toHaveBeenCalledWith(['@acme/kubb-plugin-x'], expect.objectContaining({ name: 'pnpm' }), cwd)
    expect(output.join('\n')).toContain('Plugin removed')
    expect(process.exitCode).toBeUndefined()
  })

  it('previews the lines it removes and asks before changing anything', async () => {
    vi.mocked(clack.confirm).mockResolvedValueOnce(false)

    await run({ id: 'acme/plugin-x', yes: false, uninstall: true })

    const printed = output.join('\n')
    expect(printed).toContain(`- import { pluginX } from '@acme/kubb-plugin-x'`)
    expect(printed).toContain('Uninstalls @acme/kubb-plugin-x')
    expect(printed).toContain('Remove canceled')
    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toBe(config('pluginX()'))
    expect(uninstallPackages).not.toHaveBeenCalled()
  })

  it('keeps the package with --no-uninstall', async () => {
    await run({ id: 'acme/plugin-x', yes: true, uninstall: false })

    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toBe(config('', ''))
    expect(uninstallPackages).not.toHaveBeenCalled()
  })

  it('refuses a plugin another plugin in the config needs', async () => {
    await writeFile(
      path.join(cwd, 'kubb.config.ts'),
      config('pluginX(), pluginY()', `import { pluginX } from '@acme/kubb-plugin-x'\nimport { pluginY } from '@acme/kubb-plugin-y'\n`),
    )

    await run({ id: 'acme/plugin-x', yes: true, uninstall: true })

    expect(output.join('\n')).toContain('plugin-y needs plugin-x')
    expect(uninstallPackages).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })

  it('removes a plugin that only a switched-off plugin needs', async () => {
    await writeFile(
      path.join(cwd, 'kubb.config.ts'),
      [
        `import { defineConfig } from 'kubb/config'`,
        `import { pluginX } from '@acme/kubb-plugin-x'`,
        `import { pluginY } from '@acme/kubb-plugin-y'`,
        '',
        'export default defineConfig({',
        `  input: './petStore.yaml',`,
        '  plugins: [',
        '    pluginX(),',
        '    // kubb:disabled @acme/kubb-plugin-y 1',
        '    // pluginY(),',
        '  ],',
        '})',
        '',
      ].join('\n'),
    )

    await run({ id: 'acme/plugin-x', yes: true, uninstall: true })

    expect(output.join('\n')).not.toContain('plugin-y needs plugin-x')
    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).not.toContain('pluginX')
  })

  it('keeps the package when another config entry still imports it', async () => {
    await writeFile(
      path.join(cwd, 'kubb.config.ts'),
      `import { defineConfig } from 'kubb/config'\nimport { pluginX } from '@acme/kubb-plugin-x'\n\nexport default defineConfig([\n  { plugins: [pluginX()] },\n  { plugins: [pluginX()] },\n])\n`,
    )

    await run({ id: 'acme/plugin-x', yes: true, uninstall: true })

    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toContain('{ plugins: [] },\n  { plugins: [pluginX()] },')
    expect(output.join('\n')).toContain('which another config entry still imports')
    expect(uninstallPackages).not.toHaveBeenCalled()
  })

  it('refuses the adapter', async () => {
    await run({ id: 'acme/adapter-x', yes: true, uninstall: true })

    expect(output.join('\n')).toContain('The adapter cannot be removed')
    expect(process.exitCode).toBe(1)
  })

  it('removes a parser that ships with kubb from the config and keeps it installed', async () => {
    await writeFile(
      path.join(cwd, 'kubb.config.ts'),
      `import { parserMd } from '@kubb/parser-md'\nimport { parserTs } from '@kubb/parser-ts'\n\nexport default defineConfig({\n  parsers: [parserTs(), parserMd()],\n})\n`,
    )

    await run({ id: 'kubb-labs/parser-ts', yes: true, uninstall: true })

    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toBe(
      `import { parserMd } from '@kubb/parser-md'\n\nexport default defineConfig({\n  parsers: [parserMd()],\n})\n`,
    )
    expect(uninstallPackages).not.toHaveBeenCalled()
  })

  it('exits with code 1 when the config cannot be edited', async () => {
    await writeFile(
      path.join(cwd, 'kubb.config.ts'),
      `import { parserTs } from '@kubb/parser-ts'\n\nexport default defineConfig({\n  parsers: [parserTs()],\n})\n`,
    )

    await run({ id: 'kubb-labs/parser-ts', yes: true, uninstall: true })

    expect(output.join('\n')).toContain('@kubb/parser-ts is the last parser in the parsers array')
    expect(process.exitCode).toBe(1)
  })
})
