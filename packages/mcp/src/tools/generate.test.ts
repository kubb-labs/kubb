import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { adapterOas } from '@kubb/adapter-oas'
import { afterAll, describe, expect, it } from 'vitest'
import { generateTool } from './generate.ts'

// The generate tool only loads a config that lives inside the current working directory,
// so the fixture dir is created under the package (cwd during the test run).
const dir = await mkdtemp(join(process.cwd(), 'kubb-mcp-generate-'))

type ToolResult = { isError?: boolean; content: Array<{ type: string; text?: string }> }
type GenerateInput = { config?: string; input?: string; output?: string; logLevel?: string }
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

    const { isError, text } = await run({ config: configPath })

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

    const { isError, text } = await run({ config: configPath })

    expect(isError).toBe(true)
    expect(text).toContain('KUBB_INPUT_NOT_FOUND')
  })

  it('keeps the code and the config path when the config fails to load', async () => {
    const configPath = join(dir, 'kubb.broken.config.ts')
    await writeFile(configPath, `throw new Error('boom')\n`)

    const { isError, text } = await run({ config: configPath })

    expect(isError).toBe(true)
    expect(text).toContain(`Failed to load config ${configPath}`)
    expect(text).toContain('error KUBB_UNKNOWN: boom')
    expect(text).toContain('"stack"')
  })
})
