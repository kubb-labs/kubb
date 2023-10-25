import path from 'node:path'

import { TreeNode } from './TreeNode.ts'

import type { KubbFile } from '../FileManager.ts'

type TreeNodeData = { type: KubbFile.Mode; path: KubbFile.Path; name: string }

describe('TreeNode', () => {
  const rootPath = path.resolve(__dirname, '../../mocks/treeNode')
  const tree = TreeNode.build<TreeNodeData>(rootPath, { extensions: /\.ts/ })

  test('if schemas folder contains x files and y folders', () => {
    expect(tree).toBeDefined()

    expect(tree?.root.data).toEqual({
      name: 'treeNode',
      path: rootPath,
      type: 'directory',
    })
  })

  test('if leaves are rendered correctly', () => {
    expect(tree?.leaves.length).toBe(3)

    tree?.leaves.forEach((leave) => {
      if (leave.data.name === 'hello.ts') {
        expect(leave.data.type).toBe('file')
        expect(leave.data.path).toBe(path.resolve(rootPath, 'sub', 'hello.ts'))
      }

      if (leave.data.name === 'hello.ts') {
        expect(leave.data.type).toBe('file')
        expect(leave.data.path).toBe(path.resolve(rootPath, 'sub', 'hello.ts'))
      }

      if (leave.data.name === 'test.ts') {
        expect(leave.data.type).toBe('file')
        expect(leave.data.path).toBe(path.resolve(rootPath, 'test.ts'))
      }
    })
  })
  test('if `find` is executed correctly', () => {
    const helloTS = tree?.leaves.find((leave) => leave.data.name === 'hello.ts')

    expect(tree?.find()).toBeNull()
    expect(tree?.find(helloTS?.data)?.data.name).toEqual('hello.ts')
  })

  test('if `foreach` is executed correctly', () => {
    const items: TreeNodeData[] = []

    tree?.forEach((treeNode) => {
      items.push(treeNode.data)
    })
    const names = items.map((item) => item.name)

    expect(items.length).toBe(5)
    expect(names.includes('treeNode')).toBeTruthy()
    expect(names.includes('sub')).toBeTruthy()
    expect(names.includes('hello.ts')).toBeTruthy()
    expect(names.includes('world.ts')).toBeTruthy()
    expect(names.includes('test.ts')).toBeTruthy()
  })
})
