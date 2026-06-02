import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { generateTool } from './generate.ts'

// loadUserConfig only loads a config that lives inside the current working directory,
// so the fixture dir is created under the package (cwd during the test run).
const dir = await mkdtemp(join(process.cwd(), 'kubb-mcp-generate-'))

type ToolResult = { isError?: boolean; content: Array<{ type: string; text?: string }> }
type GenerateInput = { config?: string; input?: string; output?: string; logLevel?: string }
const execute = (generateTool as unknown as { execute: (input: GenerateInput) => Promise<ToolResult> }).execute

async function run(args: GenerateInput) {
  const result = await execute({ logLevel: 'silent', ...args })
  return { isError: Boolean(result.isError), text: result.content.map((part) => part.text ?? '').join('\n') }
}

afterAll(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('generate tool', () => {
  it('returns a coded, structured diagnostic when the input file is missing', async () => {
    const configPath = join(dir, 'kubb.config.ts')
    await writeFile(
      configPath,
      `import { adapterOas } from '@kubb/adapter-oas'
export default {
  root: '.',
  input: { path: './does-not-exist.yaml' },
  output: { path: './gen' },
  adapter: adapterOas({ validate: false }),
  plugins: [],
}
`,
    )

    const { isError, text } = await run({ config: configPath })

    expect(isError).toBe(true)
    expect(text).toContain('KUBB_INPUT_NOT_FOUND')
    // The same diagnostic is included as a JSON payload, with a docs link for the code.
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
    expect(json).toMatchObject({
      code: 'KUBB_INPUT_NOT_FOUND',
      severity: 'error',
      docsUrl: expect.stringContaining('/diagnostics/kubb-input-not-found'),
    })
  })
})
