import pathParser from 'path'

import { describe, expect, test } from 'vitest'

import { FileManager } from './FileManager'

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

  test('if combine is removing previouscode', async () => {
    const fileManager = new FileManager()
    const combined = fileManager.combine([
      {
        path: pathParser.resolve('./src/models/file1.js'),
        fileName: 'file1.js',
        source: 'export const test = 2;',
      },
      {
        path: pathParser.resolve('./src/models/file1.js'),
        fileName: 'file2.js',
        source: 'export const test2 = 3;',
      },
    ])

    expect(combined).toEqual([
      {
        path: pathParser.resolve('./src/models/file1.js'),
        fileName: 'file2.js',
        imports: [],
        source: `export const test = 2;
export const test2 = 3;`,
      },
    ])
  })
})
