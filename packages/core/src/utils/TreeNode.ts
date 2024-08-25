import type * as KubbFile from '@kubb/fs/types'
import { FileManager } from '../FileManager.ts'

type BarrelData = {
  file?: KubbFile.File
  /**
   * @deprecated use file instead
   */
  type: KubbFile.Mode
  path: string
  name: string
}

export class TreeNode {
  public data: BarrelData

  public parent?: TreeNode

  public children: Array<TreeNode> = []

  constructor(data: BarrelData, parent?: TreeNode) {
    this.data = data
    this.parent = parent
    return this
  }

  addChild(data: BarrelData): TreeNode {
    const child = new TreeNode(data, this)
    if (!this.children) {
      this.children = []
    }
    this.children.push(child)
    return child
  }

  find(data?: BarrelData): TreeNode | null {
    if (!data) {
      return null
    }

    if (data === this.data) {
      return this
    }

    if (this.children?.length) {
      for (let i = 0, { length } = this.children, target: TreeNode | null = null; i < length; i++) {
        target = this.children[i]!.find(data)
        if (target) {
          return target
        }
      }
    }

    return null
  }

  get leaves(): Array<TreeNode> {
    if (!this.children || this.children.length === 0) {
      // this is a leaf
      return [this]
    }

    // if not a leaf, return all children's leaves recursively
    const leaves: TreeNode[] = []
    if (this.children) {
      for (let i = 0, { length } = this.children; i < length; i++) {
        leaves.push.apply(leaves, this.children[i]!.leaves)
      }
    }
    return leaves
  }

  get root(): TreeNode {
    if (!this.parent) {
      return this
    }
    return this.parent.root
  }

  forEach(callback: (treeNode: TreeNode) => void): this {
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

  public static build(files: KubbFile.File[], root?: string): TreeNode | null {
    try {
      const filteredTree = buildDirectoryTree(files, root)

      if (!filteredTree) {
        return null
      }

      const treeNode = new TreeNode({
        name: filteredTree.name,
        path: filteredTree.path,
        file: filteredTree.file,
        type: FileManager.getMode(filteredTree.path),
      })

      const recurse = (node: typeof treeNode, item: DirectoryTree) => {
        const subNode = node.addChild({
          name: item.name,
          path: item.path,
          file: item.file,
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

export type DirectoryTree = {
  name: string
  path: string
  file?: KubbFile.File
  children: Array<DirectoryTree>
}

export function buildDirectoryTree(files: Array<KubbFile.File>, rootFolder = ''): DirectoryTree | null {
  const rootPrefix = rootFolder.endsWith('/') ? rootFolder : `${rootFolder}/`
  const filteredFiles = files.filter((file) => (rootFolder ? file.path.startsWith(rootPrefix) && !file.path.endsWith('.json') : !file.path.endsWith('.json')))

  if (filteredFiles.length === 0) {
    return null // No files match the root folder
  }

  const root: DirectoryTree = {
    name: rootFolder || '',
    path: rootFolder || '',
    children: [],
  }

  filteredFiles.forEach((file) => {
    const path = file.path.slice(rootFolder.length)
    const parts = path.split('/')
    let currentLevel: DirectoryTree[] = root.children
    let currentPath = rootFolder

    parts.forEach((part, index) => {
      if (index !== 0) {
        currentPath += `/${part}`
      } else {
        currentPath += `${part}`
      }

      let existingNode = currentLevel.find((node) => node.name === part)

      if (!existingNode) {
        if (index === parts.length - 1) {
          // If it's the last part, it's a file
          existingNode = {
            name: part,
            file,
            path: currentPath,
          } as DirectoryTree
        } else {
          // Otherwise, it's a folder
          existingNode = {
            name: part,
            path: currentPath,
            children: [],
          } as DirectoryTree
        }
        currentLevel.push(existingNode)
      }

      // Move to the next level if it's a folder
      if (!existingNode.file) {
        currentLevel = existingNode.children
      }
    })
  })

  return root
}
