import path from 'node:path'

import { TreeNode } from './TreeNode.ts'
import type * as KubbFile from '@kubb/fs/types'

describe('TreeNode', () => {
  const files: KubbFile.File[] = [
    {
      path: 'src/test.ts',
      baseName: 'test.ts',
      source: '',
    },
    {
      path: 'src/sub/hello.ts',
      baseName: 'hello.ts',
      source: '',
    },
    {
      path: 'src/sub/world.ts',
      baseName: 'world.ts',
      source: '',
    },
  ]
  const tree = TreeNode.build(files)

  test('if schemas folder contains x files and y folders', () => {
    expect(tree).toBeDefined()

    expect(tree).toMatchInlineSnapshot(`
      TreeNode {
        "children": [
          TreeNode {
            "children": [
              TreeNode {
                "children": [],
                "data": {
                  "file": {
                    "baseName": "test.ts",
                    "path": "src/test.ts",
                    "source": "",
                  },
                  "name": "test.ts",
                  "path": "/src/test.ts",
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
                        "path": "src/sub/hello.ts",
                        "source": "",
                      },
                      "name": "hello.ts",
                      "path": "/src/sub/hello.ts",
                      "type": "single",
                    },
                    "parent": [Circular],
                  },
                  TreeNode {
                    "children": [],
                    "data": {
                      "file": {
                        "baseName": "world.ts",
                        "path": "src/sub/world.ts",
                        "source": "",
                      },
                      "name": "world.ts",
                      "path": "/src/sub/world.ts",
                      "type": "single",
                    },
                    "parent": [Circular],
                  },
                ],
                "data": {
                  "file": undefined,
                  "name": "sub",
                  "path": "/src/sub",
                  "type": "split",
                },
                "parent": [Circular],
              },
            ],
            "data": {
              "file": undefined,
              "name": "src",
              "path": "/src",
              "type": "split",
            },
            "parent": [Circular],
          },
        ],
        "data": {
          "file": undefined,
          "name": ".",
          "path": ".",
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
        expect(leave.data.path).toBe(path.join('/src/sub', 'hello.ts'))
      }

      if (leave.data.name === 'hello.ts') {
        expect(leave.data.type).toBe('single')
        expect(leave.data.path).toBe(path.join('/src/sub', 'hello.ts'))
      }

      if (leave.data.name === 'test.ts') {
        expect(leave.data.type).toBe('single')
        expect(leave.data.path).toBe(path.join('/src/test.ts'))
      }
    })
  })
  test('if `find` is executed correctly', () => {
    const helloTS = tree?.leaves.find((leave) => leave.data.name === 'hello.ts')

    expect(tree?.find()).toBeNull()
    expect(tree?.find(helloTS?.data)?.data.name).toEqual('hello.ts')
  })

  test('if `foreach` is executed correctly', () => {
    const items: TreeNode['data'][] = []

    tree?.forEach((treeNode) => {
      items.push(treeNode.data)
    })
    const names = items.map((item) => item.name)

    expect(items.length).toBe(6)
    expect(names).toMatchInlineSnapshot(`
      [
        ".",
        "src",
        "test.ts",
        "sub",
        "hello.ts",
        "world.ts",
      ]
    `)
  })
})
