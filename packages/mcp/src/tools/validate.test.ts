import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { callTool } from '../mocks/fakeKubb.ts'
import { validateTool } from './validate.ts'

const dir = await mkdtemp(join(tmpdir(), 'kubb-mcp-validate-'))

const validSpec = JSON.stringify({
  openapi: '3.0.3',
  info: { title: 'Pets', version: '1.0.0' },
  paths: {},
  components: { schemas: { Pet: { type: 'object', properties: { id: { type: 'string' } } } } },
})

const run = (inputPath: string) => callTool(validateTool, { inputPath })

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

  it('refuses a $ref to a local file outside the working directory', async () => {
    await writeFile(join(dir, 'secret.json'), JSON.stringify({ type: 'string' }))
    const spec = JSON.parse(validSpec)
    spec.components.schemas.Secret = { $ref: './secret.json' }
    const path = join(dir, 'with-ref.json')
    await writeFile(path, JSON.stringify(spec))

    const { isError, text } = await run(path)

    expect(isError).toBe(true)
    expect(text).toContain('KUBB_REF_NOT_FOUND')
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
      docsUrl: expect.stringContaining('/diagnostics#kubb-input-not-found'),
    })
  })
})
