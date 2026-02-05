import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, test } from 'vitest'
import { read } from './read.ts'
import { write } from './write.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('write', () => {
  const mocksPath = path.resolve(__dirname, '../../mocks')
  const filePath = path.resolve(mocksPath, './helloWorld.js')

  test('if write is creating a file in the mocks folder', async () => {
    const text = `export const hallo = 'world'`

    await write(filePath, text)

    const file = await read(filePath)

    expect(file).toBeDefined()
    expect(file).toBe(text)
  })

  test('do not write if file content is the same', async () => {
    const text = `export const hallo = 'world'`

    await write(filePath, text)
    await write(filePath, text)
  })

  it('should return undefined for empty data', async () => {
    const result = await write(filePath, '   ')
    expect(result).toBeUndefined()
  })

  it('should perform sanity check when enabled', async () => {
    const text = `export const hallo = 'world with sanity'`
    const result = await write(filePath, text, { sanity: true })
    expect(result).toBe(text)
  })

  it('should trim data before writing', async () => {
    const text = `  export const hallo = 'world'  `
    await write(filePath, text)
    const file = await read(filePath)
    expect(file).toBe(text.trim())
  })
})
