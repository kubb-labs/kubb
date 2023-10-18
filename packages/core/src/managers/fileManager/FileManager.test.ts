import pathParser from 'node:path'

import { Queue } from '../../utils/Queue.ts'
import { FileManager } from './FileManager.ts'

describe('FileManager', () => {
  test('fileManager.add also adds the files to the cache', () => {
    const fileManager = new FileManager()
    fileManager.add({
      path: pathParser.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    fileManager.add({
      path: pathParser.resolve('./src/models/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    expect(fileManager.extensions).toEqual(['.js', '.ts', '.tsx'])
    expect(fileManager.files.length).toBe(2)
  })

  test('fileManager.addOrAppend also adds the files to the cache', async () => {
    const fileManager = new FileManager()
    await fileManager.addOrAppend({
      path: pathParser.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: "const file1 ='file1';",
      imports: [{ name: 'path', path: 'node:path' }],
    })

    const file = await fileManager.addOrAppend({
      path: pathParser.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: "const file1Bis ='file1Bis';",
      imports: [{ name: 'fs', path: 'node:fs' }],
    })

    expect(fileManager.files.length).toBe(1)

    expect(file.source).toBe(`const file1 ='file1';\nconst file1Bis ='file1Bis';`)
    expect(file.imports).toStrictEqual([
      { name: 'path', path: 'node:path' },
      { name: 'fs', path: 'node:fs' },
    ])
  })
  test('if creation of graph is correct', () => {
    const fileManager = new FileManager()
    fileManager.add({
      path: pathParser.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })
    fileManager.add({
      path: pathParser.resolve('./src/hooks/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    fileManager.add({
      path: pathParser.resolve('./src/models/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    fileManager.add({
      path: pathParser.resolve('./src/models/file2.ts'),
      baseName: 'file2.ts',
      source: '',
    })

    expect(fileManager.files.length).toBe(4)
  })

  test('fileManager.getCacheByUUID', async () => {
    const fileManager = new FileManager()
    const file = await fileManager.add({
      path: pathParser.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    const resolvedFile = fileManager.getCacheByUUID(file.id)

    if (resolvedFile) {
      expect(resolvedFile).toBeDefined()
      expect(resolvedFile.source).toBe(file.source)
    }
  })

  test('fileManager queue', async () => {
    const taskMock = vi.fn()

    const fileManager = new FileManager({ queue: new Queue(5), task: taskMock })
    await fileManager.add({
      path: pathParser.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    expect(taskMock).toHaveBeenCalled()
  })

  test('fileManager.remove', async () => {
    const taskMock = vi.fn()

    const fileManager = new FileManager({ queue: new Queue(5), task: taskMock })
    const file = await fileManager.add({
      path: pathParser.resolve('./src/file1.ts'),
      baseName: 'file1.ts',
      source: '',
    })

    fileManager.remove(file.path)

    const expectedRemovedFile = fileManager.files.find((f) => f.path === file.path)

    expect(expectedRemovedFile).toBeUndefined()
    expect(taskMock).toHaveBeenCalled()
  })
})
