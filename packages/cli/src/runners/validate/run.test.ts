import process from 'node:process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('runValidate', () => {
  let cwd: string
  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '1')
    cwd = await mkdtemp(join(tmpdir(), 'kubb-validate-'))
    vi.spyOn(process, 'cwd').mockReturnValue(cwd)
  })

  afterEach(async () => {
    vi.doUnmock('@kubb/adapter-oas')
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    await rm(cwd, { recursive: true, force: true })
  })

  it('validates input when @kubb/adapter-oas is available', async () => {
    const validate = vi.fn(async () => undefined)
    vi.doMock('@kubb/adapter-oas', () => ({
      adapterOas: () => ({ name: 'oas', validate }),
    }))
    using logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    using fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { run: runValidate } = await import('./run.ts')

    await runValidate({ input: 'spec.yaml' })

    expect(validate).toHaveBeenCalledWith('spec.yaml', { throwOnError: true })
    const summary = stripVTControlCharacters(logSpy.mock.calls.flat().join('\n'))
    expect(summary).toContain('✓ Validation passed')
    expect(summary).toContain('1 specification validated')
    expect(summary).toContain('Input    spec.yaml')
    expect(summary).toContain('Adapter  oas')
    expect(summary).not.toContain('Plugins')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('prints install guidance when @kubb/adapter-oas is missing', async () => {
    vi.doMock('@kubb/adapter-oas', () => ({
      adapterOas: () => {
        throw new Error("Cannot find module '@kubb/adapter-oas'")
      },
    }))
    using errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    using exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit')
    }) as never)

    const { run: runValidate } = await import('./run.ts')

    await expect(runValidate({ input: 'spec.yaml' })).rejects.toThrow('process.exit')

    const summary = stripVTControlCharacters(errorSpy.mock.calls.flat().join('\n'))
    expect(summary).toContain('✗ Could not validate')
    expect(summary).toContain('@kubb/adapter-oas · not installed')
    expect(summary).toContain('Install it with:')
    expect(summary).toContain('npm install @kubb/adapter-oas')
    expect(summary).toContain("Cannot find module '@kubb/adapter-oas'")
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('keeps validation diagnostics on stderr without claiming successful checks', async () => {
    vi.doMock('@kubb/adapter-oas', () => ({
      adapterOas: () => ({
        name: 'oas',
        validate: async () => {
          throw new Error('Unresolved reference: #/components/schemas/Pet')
        },
      }),
    }))
    using _log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    using error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    using _exit = vi.spyOn(process, 'exit').mockImplementation((): never => {
      throw new Error('process.exit')
    })
    const { run } = await import('./run.ts')

    await expect(run({ input: 'spec.yaml' })).rejects.toThrow('process.exit')

    const summary = stripVTControlCharacters(error.mock.calls.flat().join('\n'))
    expect(summary).toContain('✗ Validation failed')
    expect(summary).toContain('Unresolved reference: #/components/schemas/Pet')
    expect(summary).not.toContain('specification validated')
    expect(summary).not.toContain('Install it with:')
    expect(_log).not.toHaveBeenCalled()
  })

  it.each([
    { configPath: undefined, input: 'schema.graphql' },
    { configPath: 'custom.config.mjs', input: 'schema.graphql' },
    { configPath: undefined, input: 'https://example.test/schema.graphql' },
  ])('validates $input with the configured adapter using config $configPath', async ({ configPath, input }) => {
    const marker = join(cwd, 'validated.txt')
    await writeFile(
      join(cwd, configPath ?? 'kubb.config.mjs'),
      `
      import { writeFileSync } from 'node:fs'
      export default {
        root: ${JSON.stringify(cwd)},
        adapter: {
          name: 'graphql', document: null, options: {},
          parse() { throw new Error('Generation must not run') },
          async validate(input, options) {
            if (!options.throwOnError) throw new Error('Validation must throw on errors')
            writeFileSync(${JSON.stringify(marker)}, input)
          },
        },
      }
    `,
    )
    vi.doMock('@kubb/adapter-oas', () => {
      throw new Error('OpenAPI adapter must not load')
    })
    using log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const { run } = await import('./run.ts')
    await run({ input, configPath })
    expect(await readFile(marker, 'utf8')).toBe(URL.canParse(input) ? input : join(cwd, input))
    expect(stripVTControlCharacters(log.mock.calls.flat().join('\n'))).toContain('Adapter  graphql')
  })

  it('uses every configured adapter without counting one input twice', async () => {
    const marker = join(cwd, 'adapters.txt')
    await writeFile(
      join(cwd, 'kubb.config.mjs'),
      `
      import { appendFileSync } from 'node:fs'
      export default ['first', 'second'].map(name => ({
        root: ${JSON.stringify(cwd)},
        adapter: { name, options: {}, document: null, async validate() { appendFileSync(${JSON.stringify(marker)}, name + '\\n') } },
      }))
    `,
    )
    using log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const { run } = await import('./run.ts')
    await run({ input: 'spec.custom' })
    expect(await readFile(marker, 'utf8')).toBe('first\nsecond\n')
    const summary = stripVTControlCharacters(log.mock.calls.flat().join('\n'))
    expect(summary).toContain('1 specification validated')
    expect(summary).toContain('Adapters  first, second')
  })

  it.each([undefined, ''])('defaults the input root to cwd when root is %s', async (root) => {
    const marker = join(cwd, 'validated.txt')
    await writeFile(
      join(cwd, 'kubb.config.mjs'),
      `
      import { writeFileSync } from 'node:fs'
      export default {
        ${root === undefined ? '' : `root: ${JSON.stringify(root)},`}
        adapter: { name: 'custom', async validate(input) { writeFileSync(${JSON.stringify(marker)}, input) } },
      }
    `,
    )
    using _log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const { run } = await import('./run.ts')

    await run({ input: './spec.custom' })

    expect(await readFile(marker, 'utf8')).toBe(join(cwd, 'spec.custom'))
  })

  it('reports configured adapter failures with their real name', async () => {
    await writeFile(
      join(cwd, 'kubb.config.mjs'),
      `export default {
      root: ${JSON.stringify(cwd)},
      adapter: { name: 'proto', options: {}, document: null, async validate() { throw new Error('Unknown message type') } },
    }`,
    )
    using error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    using _exit = vi.spyOn(process, 'exit').mockImplementation((): never => {
      throw new Error('process.exit')
    })
    const { run } = await import('./run.ts')
    await expect(run({ input: 'service.proto' })).rejects.toThrow('process.exit')
    const summary = stripVTControlCharacters(error.mock.calls.flat().join('\n'))
    expect(summary).toContain('Adapter  proto')
    expect(summary).toContain('Unknown message type')
    expect(summary).not.toContain('@kubb/adapter-oas')
  })

  it('does not substitute OpenAPI when a config has no adapter', async () => {
    await writeFile(join(cwd, 'kubb.config.mjs'), `export default { root: ${JSON.stringify(cwd)} }`)
    using error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    using _exit = vi.spyOn(process, 'exit').mockImplementation((): never => {
      throw new Error('process.exit')
    })
    const { run } = await import('./run.ts')
    await expect(run({ input: 'schema.graphql' })).rejects.toThrow('process.exit')
    expect(error.mock.calls.flat().join('\n')).toContain('No adapter is configured')
  })
})
