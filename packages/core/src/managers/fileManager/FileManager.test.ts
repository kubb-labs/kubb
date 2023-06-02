import pathParser from 'node:path'

import { FileManager } from './FileManager.ts'

describe('FileManager', () => {
  test('fileManager.add also adds the files to the cache', async () => {
    const fileManager = new FileManager()
    fileManager.add({
      path: pathParser.resolve('./src/file1.ts'),
      fileName: 'file1.ts',
      source: '',
    })

    fileManager.add({
      path: pathParser.resolve('./src/models/file1.ts'),
      fileName: 'file1.ts',
      source: '',
    })

    expect(fileManager.files.length).toBe(2)
  })
  test('if creation of graph is correct', async () => {
    const fileManager = new FileManager()
    fileManager.add({
      path: pathParser.resolve('./src/file1.ts'),
      fileName: 'file1.ts',
      source: '',
    })
    fileManager.add({
      path: pathParser.resolve('./src/hooks/file1.ts'),
      fileName: 'file1.ts',
      source: '',
    })

    fileManager.add({
      path: pathParser.resolve('./src/models/file1.ts'),
      fileName: 'file1.ts',
      source: '',
    })

    fileManager.add({
      path: pathParser.resolve('./src/models/file2.ts'),
      fileName: 'file2.ts',
      source: '',
    })

    expect(fileManager.files.length).toBe(4)
  })
})
