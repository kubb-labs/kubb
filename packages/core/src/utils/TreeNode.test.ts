import { TreeNode } from './TreeNode.ts'

type Type = { keyword: string; args?: any }

describe('TreeNode', () => {
  const tree = new TreeNode<Type>({
    keyword: 'array',
  })

  tree.addChild({
    keyword: 'string',
  })

  tree.addChild({
    keyword: 'min',
    args: 2,
  })

  test('if root data is set', () => {
    expect(tree).toBeDefined()

    expect(tree.toString()).toMatchInlineSnapshot(`
      "{
        "children": [
          {
            "children": [],
            "data": {
              "keyword": "string"
            }
          },
          {
            "children": [],
            "data": {
              "keyword": "min",
              "args": 2
            }
          }
        ],
        "data": {
          "keyword": "array"
        }
      }"
    `)
  })

  test('if leaves are rendered correctly', () => {
    expect(tree.leaves.length).toBe(2)

    tree.leaves.forEach((leave) => {
      if (leave.data.keyword === 'array') {
        expect(leave.data.keyword).toBe('array')
      }
    })
  })

  test('if map has correct value, previousValue and nextValue', () => {
    expect(tree.leaves.length).toBe(2)

    tree.map((leave, previouseLeave, nextLeave) => {
      if (leave.data.keyword === 'array') {
        expect(leave.data.keyword).toBe('array')
        expect(previouseLeave).toBeUndefined()
        expect(nextLeave).toBeUndefined()
      }

      if (leave.data.keyword === 'string') {
        expect(leave.data.keyword).toBe('string')
        expect(previouseLeave).toBeUndefined()
        expect(nextLeave).toBeDefined()
      }

      if (leave.data.keyword === 'min') {
        expect(leave.data.keyword).toBe('min')
        expect(previouseLeave).toBeDefined()
        expect(nextLeave).toBeUndefined()
      }
    })
  })

  test('if `find` is executed correctly', () => {
    const string = tree.leaves.find((leave) => leave.data.keyword === 'string')

    expect(string).toBeDefined()
    expect(tree.find()).toBeNull()
    expect(tree.find(string?.data)?.data.keyword).toEqual('string')
  })

  test('if `foreach` is executed correctly', () => {
    const items: TreeNode<Type>['data'][] = []

    tree.forEach((treeNode) => {
      items.push(treeNode.data)
    })
    const names = items.map((item) => item.keyword)

    expect(items.length).toBe(3)
    expect(names.includes('string')).toBeTruthy()
  })
})
