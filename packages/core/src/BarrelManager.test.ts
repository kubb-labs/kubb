import path from 'node:path'

import { isBun } from 'js-runtime'

import { format } from '../mocks/format.ts'
import { BarrelManager } from './BarrelManager.ts'
import { FileManager } from './FileManager.ts'

describe('BarrelManager', () => {
  test(`if getIndexes returns 'index.ts' files`, () => {
    const barrelManager = new BarrelManager()

    const rootPath = path.resolve(__dirname, '../mocks/treeNode')
    const files = barrelManager.getIndexes(rootPath) || []
    const rootIndex = files[0]

    expect(rootIndex).toBeDefined()

    expect(files?.every((file) => file.baseName === 'index.ts')).toBeTruthy()

    expect(rootIndex?.exports?.every((file) => !file.path.endsWith('.ts'))).toBeTruthy()
  })

  test.todo('if getIndexes can return an export with `exportAs` and/or `isTypeOnly`', async () => {
    const barrelManager = new BarrelManager()

    // const exportAs = 'models'
    const rootPath = path.resolve(__dirname, '../mocks/treeNode')

    const files = barrelManager.getIndexes(rootPath) || []
    const rootIndex = files[0]!

    expect(rootIndex).toBeDefined()

    const code = await FileManager.getSource(rootIndex)

    if (isBun()) {
      // TODO check why bun is reodering the export sort

      expect(await format(code)).toMatchSnapshot()
    } else {
      expect(await format(code)).toMatchSnapshot()
    }

    expect(rootIndex?.exports?.every((file) => file.path.endsWith('.ts'))).toBeTruthy()
  })
  test('if getIndexes can return an export with treeNode options', () => {
    const barrelManager = new BarrelManager({
      treeNode: {
        extensions: /\.ts/,
        exclude: [/schemas/, /json/],
      },
      extName: '.ts',
    })

    const rootPath = path.resolve(__dirname, '../mocks/treeNode')
    const files = barrelManager.getIndexes(rootPath) || []
    const rootIndex = files[0]

    expect(rootIndex).toBeDefined()

    expect(rootIndex?.exports?.every((file) => file.path.endsWith('.ts'))).toBeTruthy()
  })
})
