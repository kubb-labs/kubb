import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { KubbFile } from '@kubb/fabric-core/types'
import { FileManager } from '@kubb/react-fabric'
import { describe, expect, it } from 'vitest'
import { getBarrelFiles } from './getBarrelFiles.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('getBarrelFiles', () => {
  it('should generate barrel files correctly', async () => {
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
        imports: [],
        exports: [],
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
        imports: [],
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
        imports: [],
        exports: [],
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
        imports: [],
        exports: [],
      },
    ]

    await fileManager.upsert(...files)

    const barrelFiles = await getBarrelFiles(fileManager.files, {
      type: 'all',
      root: 'src',
      output: {
        path: '.',
      },
    })

    await fileManager.upsert(...barrelFiles)

    const processedFiles = fileManager.files

    await expect(JSON.stringify(processedFiles, undefined, 2)).toMatchFileSnapshot(path.resolve(__dirname, '__snapshots__/barrel.json'))
  })
})
