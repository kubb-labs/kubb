import { existsSync } from 'node:fs'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { callTool, useFakeKubbProject } from '../mocks/fakeKubb.ts'
import { initTool } from './init.ts'

const { root } = await useFakeKubbProject()

afterEach(async () => {
  await rm(join(root, 'kubb.config.ts'), { force: true })
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

  it.each(['../outside', '/tmp/kubb-mcp-outside'])('refuses the outputPath %s, outside the working directory, and writes nothing', async (outputPath) => {
    const { isError, text } = await callTool(initTool, { outputPath })

    expect(isError).toBe(true)
    expect(text).toContain('Invalid outputPath')
    expect(existsSync(join(root, 'kubb.config.ts'))).toBe(false)
  })

  it('returns an error, and keeps the file, when kubb.config.ts exists', async () => {
    const existing = 'export default {}\n'
    await writeFile(join(root, 'kubb.config.ts'), existing)

    const { isError, text } = await callTool(initTool, {})

    expect(isError).toBe(true)
    expect(text).toContain('already exists')
    expect(await readFile(join(root, 'kubb.config.ts'), 'utf8')).toBe(existing)
  })
})
