import path from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import { describe, expect, test } from 'vitest'
import { TreeNode } from './TreeNode.ts'

describe('TreeNode', () => {
  const files: KubbFile.File[] = [
    {
      path: 'src/test.ts',
      baseName: 'test.ts',
      sources: [],
      meta: {},
      imports: [],
      exports: [],
    },
    {
      path: 'src/sub/hello.ts',
      baseName: 'hello.ts',
      sources: [],
      meta: {},
      imports: [],
      exports: [],
    },
    {
      path: 'src/sub/world.ts',
      baseName: 'world.ts',
      sources: [],
      meta: {},
      imports: [],
      exports: [],
    },
  ]
  const tree = TreeNode.build(files, 'src/')
  const treeWindows = TreeNode.build(files, 'src\\')

  test('if schemas folder contains x files and y folders', () => {
    expect(tree).toBeDefined()
    expect(treeWindows).toBeDefined()

    expect(tree).toMatchInlineSnapshot(`
      TreeNode {
        "children": [
          TreeNode {
            "children": [],
            "data": {
              "file": {
                "baseName": "test.ts",
                "exports": [],
                "imports": [],
                "meta": {},
                "path": "src/test.ts",
                "sources": [],
              },
              "name": "test.ts",
              "path": "src/test.ts",
              "type": "single",
            },
            "parent": [Circular],
          },
          TreeNode {
            "children": [
              TreeNode {
                "children": [],
                "data": {
                  "file": {
                    "baseName": "hello.ts",
                    "exports": [],
                    "imports": [],
                    "meta": {},
                    "path": "src/sub/hello.ts",
                    "sources": [],
                  },
                  "name": "hello.ts",
                  "path": "src/sub/hello.ts",
                  "type": "single",
                },
                "parent": [Circular],
              },
              TreeNode {
                "children": [],
                "data": {
                  "file": {
                    "baseName": "world.ts",
                    "exports": [],
                    "imports": [],
                    "meta": {},
                    "path": "src/sub/world.ts",
                    "sources": [],
                  },
                  "name": "world.ts",
                  "path": "src/sub/world.ts",
                  "type": "single",
                },
                "parent": [Circular],
              },
            ],
            "data": {
              "file": undefined,
              "name": "sub",
              "path": "src/sub",
              "type": "split",
            },
            "parent": [Circular],
          },
        ],
        "data": {
          "file": undefined,
          "name": "src/",
          "path": "src/",
          "type": "split",
        },
        "parent": undefined,
      }
    `)
    expect(tree).toMatchInlineSnapshot(`
      TreeNode {
        "children": [
          TreeNode {
            "children": [],
            "data": {
              "file": {
                "baseName": "test.ts",
                "exports": [],
                "imports": [],
                "meta": {},
                "path": "src/test.ts",
                "sources": [],
              },
              "name": "test.ts",
              "path": "src/test.ts",
              "type": "single",
            },
            "parent": [Circular],
          },
          TreeNode {
            "children": [
              TreeNode {
                "children": [],
                "data": {
                  "file": {
                    "baseName": "hello.ts",
                    "exports": [],
                    "imports": [],
                    "meta": {},
                    "path": "src/sub/hello.ts",
                    "sources": [],
                  },
                  "name": "hello.ts",
                  "path": "src/sub/hello.ts",
                  "type": "single",
                },
                "parent": [Circular],
              },
              TreeNode {
                "children": [],
                "data": {
                  "file": {
                    "baseName": "world.ts",
                    "exports": [],
                    "imports": [],
                    "meta": {},
                    "path": "src/sub/world.ts",
                    "sources": [],
                  },
                  "name": "world.ts",
                  "path": "src/sub/world.ts",
                  "type": "single",
                },
                "parent": [Circular],
              },
            ],
            "data": {
              "file": undefined,
              "name": "sub",
              "path": "src/sub",
              "type": "split",
            },
            "parent": [Circular],
          },
        ],
        "data": {
          "file": undefined,
          "name": "src/",
          "path": "src/",
          "type": "split",
        },
        "parent": undefined,
      }
    `)
  })

  test('if leaves are rendered correctly', () => {
    expect(tree?.leaves.length).toBe(3)

    tree?.leaves.forEach((leave) => {
      if (leave.data.name === 'hello.ts') {
        expect(leave.data.type).toBe('single')
        expect(leave.data.path).toBe(path.join('src/sub', 'hello.ts'))
      }

      if (leave.data.name === 'hello.ts') {
        expect(leave.data.type).toBe('single')
        expect(leave.data.path).toBe(path.join('src/sub', 'hello.ts'))
      }

      if (leave.data.name === 'test.ts') {
        expect(leave.data.type).toBe('single')
        expect(leave.data.path).toBe(path.join('src/test.ts'))
      }
    })
  })
  test('if `find` is executed correctly', () => {
    const helloTS = tree?.leaves.find((leave) => leave.data.name === 'hello.ts')

    expect(tree?.findDeep).toBeDefined()
    expect(tree?.findDeep((item) => item.data === helloTS?.data)?.data.name).toEqual('hello.ts')
  })

  test('if `foreach` is executed correctly', () => {
    const items: TreeNode['data'][] = []

    tree?.forEach((treeNode) => {
      items.push(treeNode.data)
    })
    const names = items.map((item) => item.name)

    expect(items.length).toBe(5)
    expect(names).toMatchInlineSnapshot(`
      [
        "src/",
        "test.ts",
        "sub",
        "hello.ts",
        "world.ts",
      ]
    `)
  })

  test('if `forEachDeep` is executed correctly', () => {
    const leafNames: string[] = []

    tree?.forEachDeep((treeNode) => {
      leafNames.push(treeNode.data.name)
    })

    expect(leafNames.length).toBe(3)
    expect(leafNames).toEqual(['test.ts', 'hello.ts', 'world.ts'])
  })

  test('if `filterDeep` is executed correctly', () => {
    const subFiles = tree?.filterDeep((treeNode) => treeNode.data.path.includes('sub'))

    expect(subFiles?.length).toBe(2)
    expect(subFiles?.map((node) => node.data.name)).toEqual(['hello.ts', 'world.ts'])
  })

  test('if `mapDeep` is executed correctly', () => {
    const filePaths = tree?.mapDeep((treeNode) => treeNode.data.path)

    expect(filePaths?.length).toBe(3)
    expect(filePaths).toContain('src/test.ts')
    expect(filePaths).toContain(path.join('src/sub', 'hello.ts'))
    expect(filePaths).toContain(path.join('src/sub', 'world.ts'))
  })

  test('if forEach throws error with non-function', () => {
    expect(() => tree?.forEach(null as any)).toThrow('forEach() callback must be a function')
  })

  test('if findDeep throws error with non-function', () => {
    expect(() => tree?.findDeep(null as any)).toThrow('find() predicate must be a function')
  })

  test('if forEachDeep throws error with non-function', () => {
    expect(() => tree?.forEachDeep(null as any)).toThrow('forEach() callback must be a function')
  })

  test('if filterDeep throws error with non-function', () => {
    expect(() => tree?.filterDeep(null as any)).toThrow('filter() callback must be a function')
  })

  test('if mapDeep throws error with non-function', () => {
    expect(() => tree?.mapDeep(null as any)).toThrow('map() callback must be a function')
  })

  test('if build handles empty file list', () => {
    const emptyTree = TreeNode.build([], 'src/')
    expect(emptyTree).toBeNull()
  })

  test('if build filters out JSON files', () => {
    const filesWithJson: KubbFile.File[] = [
      ...files,
      {
        path: 'src/data.json',
        baseName: 'data.json',
        sources: [],
        meta: {},
        imports: [],
        exports: [],
      },
    ]
    const treeWithJson = TreeNode.build(filesWithJson, 'src/')
    const leaves = treeWithJson?.leaves || []

    expect(leaves.every((leaf) => !leaf.data.path.endsWith('.json'))).toBe(true)
  })
})
