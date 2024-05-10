import dirTree from 'directory-tree'

import { FileManager } from '../FileManager.ts'

import type * as KubbFile from '@kubb/fs/types'
import type { DirectoryTree, DirectoryTreeOptions } from 'directory-tree'

export type TreeNodeOptions = DirectoryTreeOptions

type BarrelData = { type: KubbFile.Mode; path: KubbFile.Path; name: string }

export class TreeNode<T = BarrelData> {
  public data: T

  public parent?: TreeNode<T>

  public children: Array<TreeNode<T>> = []

  constructor(data: T, parent?: TreeNode<T>) {
    this.data = data
    this.parent = parent
    return this
  }

  addChild(data: T): TreeNode<T> {
    const child = new TreeNode(data, this)
    if (!this.children) {
      this.children = []
    }
    this.children.push(child)
    return child
  }

  find(data?: T): TreeNode<T> | null {
    if (!data) {
      return null
    }

    if (data === this.data) {
      return this
    }

    if (this.children?.length) {
      for (let i = 0, { length } = this.children, target: TreeNode<T> | null = null; i < length; i++) {
        target = this.children[i]!.find(data)
        if (target) {
          return target
        }
      }
    }

    return null
  }

  get leaves(): TreeNode<T>[] {
    if (!this.children || this.children.length === 0) {
      // this is a leaf
      return [this]
    }

    // if not a leaf, return all children's leaves recursively
    const leaves: TreeNode<T>[] = []
    if (this.children) {
      for (let i = 0, { length } = this.children; i < length; i++) {
        leaves.push.apply(leaves, this.children[i]!.leaves)
      }
    }
    return leaves
  }

  get root(): TreeNode<T> {
    if (!this.parent) {
      return this
    }
    return this.parent.root
  }

  forEach(callback: (treeNode: TreeNode<T>) => void): this {
    if (typeof callback !== 'function') {
      throw new TypeError('forEach() callback must be a function')
    }

    // run this node through function
    callback(this)

    // do the same for all children
    if (this.children) {
      for (let i = 0, { length } = this.children; i < length; i++) {
        this.children[i]?.forEach(callback)
      }
    }

    return this
  }

  public static build(path: string, options: TreeNodeOptions = {}): TreeNode | null {
    try {
      const exclude = Array.isArray(options.exclude) ? options.exclude : [options.exclude].filter(Boolean)
      const filteredTree = dirTree(path, {
        extensions: options.extensions,
        exclude: [/node_modules/, ...exclude],
      })

      if (!filteredTree) {
        return null
      }

      const treeNode = new TreeNode({
        name: filteredTree.name,
        path: filteredTree.path,
        type: FileManager.getMode(filteredTree.path),
      })

      const recurse = (node: typeof treeNode, item: DirectoryTree) => {
        const subNode = node.addChild({
          name: item.name,
          path: item.path,
          type: FileManager.getMode(item.path),
        })

        if (item.children?.length) {
          item.children?.forEach((child) => {
            recurse(subNode, child)
          })
        }
      }

      filteredTree.children?.forEach((child) => recurse(treeNode, child))

      return treeNode
    } catch (e) {
      throw new Error('Something went wrong with creating index files with the TreehNode class', { cause: e })
    }
  }
}
