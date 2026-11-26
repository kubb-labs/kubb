import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { callTool } from '../mocks/fakeKubb.ts'
import { initTool } from './init.ts'

const root = await mkdtemp(join(tmpdir(), 'kubb-mcp-init-'))

beforeEach(() => {
  vi.spyOn(process, 'cwd').mockReturnValue(root)
})

afterEach(() => {
  vi.restoreAllMocks()
})

afterAll(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('init tool', () => {
  it('writes kubb.config.ts with inputPath and outputPath', async () => {
    const { isError, text } = await callTool(initTool, { inputPath: './specs/pets.yaml', outputPath: './src/api' })
    const config = await readFile(join(root, 'kubb.config.ts'), 'utf8')

    expect(isError).toBe(false)
    expect(text).toContain('Created kubb.config.ts')
    expect(text).toContain('kubb_add')
    expect(config).toContain('./specs/pets.yaml')
    expect(config).toContain('./src/api')
  })

  it('returns an error, and keeps the file, when kubb.config.ts exists', async () => {
    const before = await readFile(join(root, 'kubb.config.ts'), 'utf8')

    const { isError, text } = await callTool(initTool, {})

    expect(isError).toBe(true)
    expect(text).toContain('already exists')
    expect(await readFile(join(root, 'kubb.config.ts'), 'utf8')).toBe(before)
  })
})
