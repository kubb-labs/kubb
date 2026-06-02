import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { validateTool } from './validate.ts'

const dir = await mkdtemp(join(tmpdir(), 'kubb-mcp-validate-'))

const validSpec = JSON.stringify({
  openapi: '3.0.3',
  info: { title: 'Pets', version: '1.0.0' },
  paths: {},
  components: { schemas: { Pet: { type: 'object', properties: { id: { type: 'string' } } } } },
})

type ToolResult = { isError?: boolean; content: Array<{ type: string; text?: string }> }
const execute = (validateTool as unknown as { execute: (input: { input: string }) => Promise<ToolResult> }).execute

async function run(input: string) {
  const result = await execute({ input })
  return { isError: Boolean(result.isError), text: result.content.map((part) => part.text ?? '').join('\n') }
}

afterAll(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('validate tool', () => {
  it('reports success for a valid spec', async () => {
    const path = join(dir, 'valid.json')
    await writeFile(path, validSpec)

    const { isError, text } = await run(path)

    expect(isError).toBe(false)
    expect(text).toContain('Validation successful')
  })

  it('returns a coded diagnostic for a missing spec file', async () => {
    const { isError, text } = await run(join(dir, 'does-not-exist.yaml'))

    expect(isError).toBe(true)
    expect(text).toContain('KUBB_INPUT_NOT_FOUND')
    // The serialized diagnostic is included as a JSON payload the assistant can parse.
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
    expect(json).toMatchObject({
      code: 'KUBB_INPUT_NOT_FOUND',
      severity: 'error',
      docsUrl: expect.stringContaining('/diagnostics/kubb-input-not-found'),
    })
  })
})
