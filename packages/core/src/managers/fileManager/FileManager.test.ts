import pathParser from 'node:path'

import { Queue } from '../../utils/Queue.ts'
import { FileManager } from './FileManager.ts'

describe('FileManager', () => {
  test('fileManager.add also adds the files to the cache', () => {
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
    expect(fileManager.cachedFiles.length).toBe(2)
  })

  test('fileManager.addOrAppend also adds the files to the cache', async () => {
    const fileManager = new FileManager()
    await fileManager.addOrAppend({
      path: pathParser.resolve('./src/file1.ts'),
      fileName: 'file1.ts',
      source: "const file1 ='file1';",
      imports: [{ name: 'path', path: 'node:path' }],
    })

    const file = await fileManager.addOrAppend({
      path: pathParser.resolve('./src/file1.ts'),
      fileName: 'file1.ts',
      source: "const file1Bis ='file1Bis';",
      imports: [{ name: 'fs', path: 'node:fs' }],
    })

    expect(fileManager.files.length).toBe(1)
    expect(fileManager.cachedFiles.length).toBe(1)

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
    expect(fileManager.cachedFiles.length).toBe(4)
  })

  test('fileManager.get', async () => {
    const fileManager = new FileManager()
    const file = await fileManager.add({
      path: pathParser.resolve('./src/file1.ts'),
      fileName: 'file1.ts',
      source: '',
    })

    const id = fileManager.getCacheByPath(file.path)

    if (id) {
      const fileWithGet = fileManager.get(id.id)

      expect(id).toBeDefined()
      expect(fileWithGet?.source).toBe(file.source)
    }
  })

  test('fileManager queue', async () => {
    const taskMock = vi.fn()

    const fileManager = new FileManager({ queue: new Queue(5), task: taskMock })
    await fileManager.add({
      path: pathParser.resolve('./src/file1.ts'),
      fileName: 'file1.ts',
      source: '',
    })

    expect(taskMock).toBeCalled()
  })

  test('fileManager.setStatus', async () => {
    const taskMock = vi.fn()

    const fileManager = new FileManager({ queue: new Queue(5), task: taskMock })
    const file = await fileManager.add({
      path: pathParser.resolve('./src/file1.ts'),
      fileName: 'file1.ts',
      source: '',
    })

    let fileCache = fileManager.cachedFiles.find((item) => item.file.path === file.path)
    expect(fileCache).toBeDefined()

    if (fileCache) {
      fileManager.setStatus(fileCache.id, 'removed')

      fileCache = fileManager.cachedFiles.find((item) => item.file.path === file.path)

      expect(fileCache?.status).toBe('removed')
    }

    expect(fileManager.setStatus('sdfsfs', 'removed')).toBeUndefined()
    expect(taskMock).toBeCalled()
  })

  test('fileManager.remove', async () => {
    const taskMock = vi.fn()

    const fileManager = new FileManager({ queue: new Queue(5), task: taskMock })
    const file = await fileManager.add({
      path: pathParser.resolve('./src/file1.ts'),
      fileName: 'file1.ts',
      source: '',
    })

    let fileCache = fileManager.cachedFiles.find((item) => item.file.path === file.path)
    expect(fileCache).toBeDefined()

    if (fileCache) {
      fileManager.remove(fileCache.id)

      fileCache = fileManager.cachedFiles.find((item) => item.file.path === file.path)

      expect(fileCache?.status).toBe('removed')
    }

    expect(fileManager.remove('sdfsfs')).toBeUndefined()
    expect(taskMock).toBeCalled()
  })
})
