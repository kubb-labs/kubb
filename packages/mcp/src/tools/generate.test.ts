import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { adapterOas } from '@kubb/adapter-oas'
import { afterAll, describe, expect, it } from 'vitest'
import { generateTool } from './generate.ts'

// The generate tool only loads a config that lives inside the current working directory,
// so the fixture dir is created under the package (cwd during the test run).
const dir = await mkdtemp(join(process.cwd(), 'kubb-mcp-generate-'))

type ToolResult = { isError?: boolean; content: Array<{ type: string; text?: string }> }
type GenerateInput = { configPath?: string; inputPath?: string; outputPath?: string; logLevel?: string }
const execute = (generateTool as unknown as { execute: (input: GenerateInput) => Promise<ToolResult> }).execute

async function run(args: GenerateInput) {
  const result = await execute({ logLevel: 'silent', ...args })
  return { isError: Boolean(result.isError), text: result.content.map((part) => part.text ?? '').join('\n') }
}

// jiti resolves a fixture's `@kubb/adapter-oas` import to the package `dist`, which exists only after a build.
// The fixtures read this config from `globalThis` instead, so the adapter comes from source.
const missingInput = { root: '.', input: './does-not-exist.yaml', output: { path: './gen' }, adapter: adapterOas({ validate: false }), plugins: [] }
Object.assign(globalThis, { __kubbMcpTestConfig: missingInput })

afterAll(async () => {
  delete (globalThis as { __kubbMcpTestConfig?: unknown }).__kubbMcpTestConfig
  await rm(dir, { recursive: true, force: true })
})

describe('generate tool', () => {
  it('returns a coded, structured diagnostic when the input file is missing', async () => {
    const configPath = join(dir, 'kubb.config.ts')
    await writeFile(configPath, `export default globalThis.__kubbMcpTestConfig\n`)

    const { isError, text } = await run({ configPath })

    expect(isError).toBe(true)
    expect(text).toContain('KUBB_INPUT_NOT_FOUND')
    // The same diagnostic is included as a JSON payload, with a docs link for the code.
    const [json] = JSON.parse(text.slice(text.indexOf('```json\n') + 8, text.indexOf('\n```', text.indexOf('```json\n'))))
    expect(json).toMatchObject({
      code: 'KUBB_INPUT_NOT_FOUND',
      severity: 'error',
      docsUrl: expect.stringContaining('/diagnostics#kubb-input-not-found'),
    })
  })

  it('generates the first entry of an array config', async () => {
    const configPath = join(dir, 'kubb.array.config.ts')
    await writeFile(configPath, `export default [globalThis.__kubbMcpTestConfig]\n`)

    const { isError, text } = await run({ configPath })

    expect(isError).toBe(true)
    expect(text).toContain('KUBB_INPUT_NOT_FOUND')
  })

  it.each([
    ['an output outside the working directory', { outputPath: '../../outside-gen' }, 'Invalid outputPath'],
    ['an absolute output outside the working directory', { outputPath: '/tmp/kubb-outside-gen' }, 'Invalid outputPath'],
    ['an input file outside the working directory', { inputPath: '../../secrets/spec.yaml' }, 'Invalid inputPath'],
  ])('refuses %s before generating', async (_label, args, message) => {
    const configPath = join(dir, 'kubb.paths.config.ts')
    await writeFile(configPath, `export default globalThis.__kubbMcpTestConfig\n`)

    const { isError, text } = await run({ configPath, ...args })

    expect(isError).toBe(true)
    expect(text).toContain(message)
  })

  it('refuses a config whose own output.path is outside the working directory', async () => {
    const configPath = join(dir, 'kubb.outside.config.ts')
    await writeFile(configPath, `export default { ...globalThis.__kubbMcpTestConfig, output: { path: '../../outside-gen', clean: true } }\n`)

    const { isError, text } = await run({ configPath })

    expect(isError).toBe(true)
    expect(text).toContain(`Invalid output.path in ${configPath}`)
  })

  it('resolves the output against the config root, as core does', async () => {
    const configPath = join(dir, 'kubb.root.config.ts')
    await writeFile(configPath, `export default { ...globalThis.__kubbMcpTestConfig, root: '../..' }\n`)

    const { isError, text } = await run({ configPath, outputPath: 'gen' })

    expect(isError).toBe(true)
    expect(text).toContain('Invalid outputPath')
  })

  it('refuses an output that a symlink inside the working directory points outside it', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'kubb-mcp-outside-'))
    await symlink(outside, join(dir, 'linked'), 'dir')
    const configPath = join(dir, 'kubb.symlink.config.ts')
    await writeFile(configPath, `export default globalThis.__kubbMcpTestConfig\n`)

    try {
      const { isError, text } = await run({ configPath, outputPath: 'linked/gen' })

      expect(isError).toBe(true)
      expect(text).toContain('Invalid outputPath')
    } finally {
      await rm(outside, { recursive: true, force: true })
    }
  })

  it('refuses an output through a dangling symlink inside the working directory', async () => {
    await symlink(join(tmpdir(), 'kubb-mcp-missing-target'), join(dir, 'dangling'), 'dir')
    const configPath = join(dir, 'kubb.dangling.config.ts')
    await writeFile(configPath, `export default globalThis.__kubbMcpTestConfig\n`)

    const { isError, text } = await run({ configPath, outputPath: 'dangling/gen' })

    expect(isError).toBe(true)
    expect(text).toContain('Invalid outputPath')
  })

  it('accepts a URL input and an output inside the working directory', async () => {
    const configPath = join(dir, 'kubb.url.config.ts')
    await writeFile(configPath, `export default globalThis.__kubbMcpTestConfig\n`)

    const { text } = await run({ configPath, inputPath: 'http://127.0.0.1:1/openapi.yaml', outputPath: join(dir, 'gen') })

    expect(text).not.toContain('Invalid inputPath')
    expect(text).not.toContain('Invalid outputPath')
  })

  it('keeps the code and the config path when the config fails to load', async () => {
    const configPath = join(dir, 'kubb.broken.config.ts')
    await writeFile(configPath, `throw new Error('boom')\n`)

    const { isError, text } = await run({ configPath })

    expect(isError).toBe(true)
    expect(text).toContain(`Failed to load config ${configPath}`)
    expect(text).toContain('error KUBB_UNKNOWN: boom')
    expect(text).toContain('"stack"')
  })
})
