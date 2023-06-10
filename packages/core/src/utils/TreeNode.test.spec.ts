import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { TreeNode } from './TreeNode.js'

import type { Path } from '../types.js'
import type { PathMode } from './read.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type TreeNodeData = { type: PathMode; path: Path; name: string }

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
    expect(names).toEqual(['treeNode', 'sub', 'hello.ts', 'world.ts', 'test.ts'])
  })
})
