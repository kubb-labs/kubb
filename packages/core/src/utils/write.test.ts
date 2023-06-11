import path from 'node:path'

import { clean } from './clean.ts'
import { read } from './read.ts'
import { write } from './write.ts'

describe('write', () => {
  const mocksPath = path.resolve(__dirname, '../../mocks')
  const filePath = path.resolve(mocksPath, './hellowWorld.js')
  const folderPath = path.resolve(mocksPath, './folder')

  afterEach(async () => {
    await clean(filePath)
    await clean(folderPath)
  })

  test('if write is creating a file in the mocks folder', async () => {
    const text = `export const hallo = 'world';`

    await write(text, filePath)

    const file = await read(filePath)

    expect(file).toBeDefined()
    expect(file).toBe(text)
  })

  test('do not write if file content is the same', async () => {
    const text = `export const hallo = 'world';`

    await write(text, filePath)
    await write(text, filePath)
  })
})
