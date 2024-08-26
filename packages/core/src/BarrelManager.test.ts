import type * as KubbFile from '@kubb/fs/types'

import { format } from '../mocks/format.ts'
import { BarrelManager } from './BarrelManager.ts'
import { getSource } from './FileManager.ts'

describe('BarrelManager', () => {
  const files: KubbFile.File[] = [
    {
      path: 'src/test.ts',
      baseName: 'test.ts',
      source: '',
      sources: [],
    },
    {
      path: 'src/sub/hello.ts',
      baseName: 'hello.ts',
      source: '',
      sources: [],
    },
    {
      path: 'src/sub/world.ts',
      baseName: 'world.ts',
      source: '',
      sources: [],
    },
  ]

  test(`if getIndexes returns 'index.ts' files`, () => {
    const barrelManager = new BarrelManager()
    const indexFiles = barrelManager.getIndexes(files, 'src') || []
    const rootIndex = indexFiles[0]

    expect(rootIndex).toBeDefined()

    expect(indexFiles?.every((file) => file.baseName === 'index.ts')).toBeTruthy()

    expect(rootIndex?.exports?.every((file) => !file.path?.endsWith('.ts'))).toBeTruthy()
  })

  test.todo('if getIndexes can return an export with `exportAs` and/or `isTypeOnly`', async () => {
    const barrelManager = new BarrelManager()
    const indexFiles = barrelManager.getIndexes(files, 'src') || []

    const rootIndex = indexFiles[0]!

    expect(rootIndex).toBeDefined()

    const code = await getSource(rootIndex)

    expect(await format(code)).toMatchSnapshot()

    expect(rootIndex?.exports?.every((file) => file.path?.endsWith('.ts'))).toBeTruthy()
  })
  test('if getIndexes can return an export with treeNode options', () => {
    const barrelManager = new BarrelManager()
    const indexFiles = barrelManager.getIndexes(files, 'src') || []
    const rootIndex = indexFiles[0]

    expect(rootIndex).toBeDefined()

    expect(rootIndex?.exports?.every((file) => file.path?.endsWith('.ts'))).toBeTruthy()
  })
})
