import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installPackages } from '../init/utils.ts'
import { run } from './run.ts'

vi.mock('../init/utils.ts', () => ({
  detectPackageManager: vi.fn(() => ({ name: 'pnpm', lockFiles: [], initCommand: [], installCommand: ['add', '-D'] })),
  installPackages: vi.fn(async () => {}),
}))

const configSource = `import { defineConfig } from 'kubb/config'\n\nexport default defineConfig({\n  input: './petStore.yaml',\n  plugins: [],\n})\n`

function detail({
  kind = 'plugin',
  name = 'plugin-x',
  exportName = 'pluginX',
  compatibility,
}: { kind?: string; name?: string; exportName?: string; compatibility?: object } = {}) {
  return {
    id: `acme/${name}`,
    kind,
    type: 'community',
    artifact: { kind: 'npm', package: `@acme/kubb-${name}`, version: '1.2.0' },
    manifest: { kind, name, export: exportName, displayName: 'X', description: 'Generates X.', compatibility },
    submittedAt: '2026-10-12T20:00:00Z',
    publishedAt: '2026-10-12T20:00:00Z',
    reviewedAt: '2026-10-12T20:00:00Z',
    overview: null,
  }
}

function respond(status: number, body?: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(body === undefined ? null : JSON.stringify(body), { status })),
  )
}

let cwd: string
let output: Array<string>

beforeEach(async () => {
  cwd = await mkdtemp(path.join(tmpdir(), 'kubb-add-'))
  await writeFile(path.join(cwd, 'kubb.config.ts'), configSource)
  vi.spyOn(process, 'cwd').mockReturnValue(cwd)
  output = []
  for (const method of ['log', 'warn', 'error'] as const) vi.spyOn(console, method).mockImplementation((...args) => void output.push(args.join(' ')))
  process.exitCode = undefined
})

afterEach(async () => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.mocked(installPackages).mockClear()
  process.exitCode = undefined
  await rm(cwd, { recursive: true, force: true })
})

describe('kubb add', () => {
  it('installs the pinned version and adds the plugin to the config', async () => {
    respond(200, detail())

    await run({ id: 'acme/plugin-x', yes: true, install: true })

    expect(globalThis.fetch).toHaveBeenCalledWith('https://kubb.dev/registry/acme/plugin-x.json', expect.anything())
    expect(installPackages).toHaveBeenCalledWith(['@acme/kubb-plugin-x@1.2.0'], expect.objectContaining({ name: 'pnpm' }), cwd)
    const config = await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')
    expect(config).toContain(`import { pluginX } from '@acme/kubb-plugin-x'`)
    expect(config).toContain('plugins: [pluginX()]')
    expect(process.exitCode).toBeUndefined()
  })

  it('prints the snippet for an adapter instead of editing the config', async () => {
    respond(200, detail({ kind: 'adapter', name: 'adapter-x', exportName: 'adapterX' }))

    await run({ id: 'acme/adapter-x', yes: true, install: false })

    expect(installPackages).not.toHaveBeenCalled()
    expect(await readFile(path.join(cwd, 'kubb.config.ts'), 'utf8')).toBe(configSource)
    expect(output.join('\n')).toContain(`import { adapterX } from '@acme/kubb-adapter-x'`)
    expect(output.join('\n')).toContain('adapter: adapterX(),')
    expect(output.join('\n')).not.toContain('export default defineConfig(')
    expect(output.join('\n')).toContain('Install @acme/kubb-adapter-x@')
    expect(output.join('\n')).not.toContain('Added @acme/kubb-adapter-x')
  })

  it('refuses an extension that needs another Kubb version', async () => {
    respond(200, detail({ compatibility: { kubb: '>=99.0.0' } }))

    await run({ id: 'acme/plugin-x', yes: true, install: true })

    expect(installPackages).not.toHaveBeenCalled()
    expect(output.join('\n')).toMatch(/"plugin-x" requires Kubb >=99\.0\.0/)
    expect(process.exitCode).toBe(1)
  })

  it('names the id and the registry when the extension is unknown', async () => {
    respond(404)

    await run({ id: 'plugin-missing', yes: true, install: true })

    expect(output.join('\n')).toContain('"kubb-labs/plugin-missing" is not in the registry at https://kubb.dev/registry.')
    expect(process.exitCode).toBe(1)
  })

  it.each([
    ['an id with another shape', '../etc/passwd', 'is not a registry id'],
    ['a package name that is not one', 'acme/plugin-x', 'sent an invalid entry'],
  ])('refuses %s before installing', async (_label, id, message) => {
    respond(200, { ...detail(), artifact: { kind: 'npm', package: '--registry=https://evil.test', version: '1.2.0' } })

    await run({ id, yes: true, install: true })

    expect(installPackages).not.toHaveBeenCalled()
    expect(output.join('\n')).toContain(message)
  })
})
