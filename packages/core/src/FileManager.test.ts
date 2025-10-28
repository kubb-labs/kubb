import path from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import { FileManager } from '@kubb/react-fabric'
import { getBarrelFiles, getMode } from './FileManager.ts'

describe('FileManager', () => {
  const mocksPath = path.resolve(__dirname, '../../mocks')
  const filePath = path.resolve(mocksPath, './hellowWorld.js')
  const folderPath = path.resolve(mocksPath, './folder')

  test('if getMode returns correct mode (single or split)', () => {
    expect(getMode(filePath)).toBe('single')
    expect(getMode(folderPath)).toBe('split')
    expect(getMode(undefined)).toBe('split')
    expect(getMode(null)).toBe('split')
  })

  test('getBarrelFiles', async () => {
    const fileManager = new FileManager()
    const files: KubbFile.File[] = [
      {
        path: 'src/test.ts',
        baseName: 'test.ts',
        sources: [
          {
            name: 'test',
            value: 'export const test = 2;',
            isExportable: true,
            isIndexable: true,
          },
        ],
      },
      {
        path: 'src/sub/index.ts',
        baseName: 'index.ts',
        sources: [
          {
            name: 'hello',
            value: '',
          },
          {
            name: 'world',
            value: '',
          },
        ],
        exports: [
          {
            name: ['hello'],
            path: './sub/hello.ts',
          },
          {
            name: ['world'],
            path: './sub/world.ts',
          },
        ],
      },
      {
        path: 'src/sub/hello.ts',
        baseName: 'hello.ts',
        sources: [
          {
            name: 'hello',
            value: 'export const hello = 2;',
            isExportable: true,
            isIndexable: true,
          },
        ],
      },
      {
        path: 'src/sub/world.ts',
        baseName: 'world.ts',
        sources: [
          {
            name: 'world',
            value: 'export const world = 2;',
            isExportable: true,
            isIndexable: true,
          },
        ],
      },
    ]

    await fileManager.add(...files)

    const barrelFiles = await getBarrelFiles(fileManager.files, {
      type: 'all',
      root: 'src',
      output: {
        path: '.',
      },
    })

    await fileManager.add(...barrelFiles)

    const processedFiles = fileManager.files

    await expect(JSON.stringify(processedFiles, undefined, 2)).toMatchFileSnapshot(path.resolve(__dirname, '__snapshots__/barrel.json'))
  })
})
