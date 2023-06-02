import pathParser from 'node:path'

import { FileManager } from './FileManager.js'

describe('FileManager', () => {
  test('fileManager.add also adds the files to the cache', async () => {
    const fileManager = new FileManager()
    fileManager.add({
      path: pathParser.resolve('./src/file1.js'),
      fileName: 'file1.js',
      source: '',
    })

    fileManager.add({
      path: pathParser.resolve('./src/models/file1.js'),
      fileName: 'file1.js',
      source: '',
    })

    expect(fileManager.files.length).toBe(2)
  })
  test('if creation of graph is correct', async () => {
    const fileManager = new FileManager()
    fileManager.add({
      path: pathParser.resolve('./src/file1.js'),
      fileName: 'file1.js',
      source: '',
    })
    fileManager.add({
      path: pathParser.resolve('./src/hooks/file1.js'),
      fileName: 'file1.js',
      source: '',
    })

    fileManager.add({
      path: pathParser.resolve('./src/models/file1.js'),
      fileName: 'file1.js',
      source: '',
    })

    fileManager.add({
      path: pathParser.resolve('./src/models/file2.js'),
      fileName: 'file2.js',
      source: '',
    })

    expect(fileManager.files.length).toBe(4)
  })
})
