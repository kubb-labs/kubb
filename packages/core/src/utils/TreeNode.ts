import type { KubbFile } from '@kubb/fabric-core/types'
import { getMode } from '../PluginManager.ts'

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
  data: BarrelData
  parent?: TreeNode
  children: Array<TreeNode> = []
  #cachedLeaves?: Array<TreeNode> = undefined

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

  get root(): TreeNode {
    if (!this.parent) {
      return this
    }
    return this.parent.root
  }

  get leaves(): Array<TreeNode> {
    if (!this.children || this.children.length === 0) {
      // this is a leaf
      return [this]
    }

    if (this.#cachedLeaves) {
      return this.#cachedLeaves
    }

    // if not a leaf, return all children's leaves recursively
    const leaves: TreeNode[] = []
    if (this.children) {
      for (let childIndex = 0, { length } = this.children; childIndex < length; childIndex++) {
        leaves.push.apply(leaves, this.children[childIndex]!.leaves)
      }
    }

    this.#cachedLeaves = leaves

    return leaves
  }

  forEach(callback: (treeNode: TreeNode) => void): this {
    if (typeof callback !== 'function') {
      throw new TypeError('forEach() callback must be a function')
    }

    // run this node through function
    callback(this)

    // do the same for all children
    if (this.children) {
      for (let childIndex = 0, { length } = this.children; childIndex < length; childIndex++) {
        this.children[childIndex]?.forEach(callback)
      }
    }

    return this
  }

  findDeep(predicate?: (value: TreeNode, index: number, obj: TreeNode[]) => boolean): TreeNode | undefined {
    if (typeof predicate !== 'function') {
      throw new TypeError('find() predicate must be a function')
    }

    return this.leaves.find(predicate)
  }

  forEachDeep(callback: (treeNode: TreeNode) => void): void {
    if (typeof callback !== 'function') {
      throw new TypeError('forEach() callback must be a function')
    }

    this.leaves.forEach(callback)
  }

  filterDeep(callback: (treeNode: TreeNode) => boolean): Array<TreeNode> {
    if (typeof callback !== 'function') {
      throw new TypeError('filter() callback must be a function')
    }

    return this.leaves.filter(callback)
  }

  mapDeep<T>(callback: (treeNode: TreeNode) => T): Array<T> {
    if (typeof callback !== 'function') {
      throw new TypeError('map() callback must be a function')
    }

    return this.leaves.map(callback)
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
        type: getMode(filteredTree.path),
      })

      const recurse = (node: typeof treeNode, item: DirectoryTree) => {
        const subNode = node.addChild({
          name: item.name,
          path: item.path,
          file: item.file,
          type: getMode(item.path),
        })

        if (item.children?.length) {
          item.children?.forEach((child) => {
            recurse(subNode, child)
          })
        }
      }

      filteredTree.children?.forEach((child) => {
        recurse(treeNode, child)
      })

      return treeNode
    } catch (error) {
      throw new Error('Something went wrong with creating barrel files with the TreeNode class', { cause: error })
    }
  }
}

export type DirectoryTree = {
  name: string
  path: string
  file?: KubbFile.File
  children: Array<DirectoryTree>
}

const normalizePath = (p: string): string => p.replace(/\\/g, '/')

export function buildDirectoryTree(files: Array<KubbFile.File>, rootFolder = ''): DirectoryTree | null {
  const normalizedRootFolder = normalizePath(rootFolder)
  const rootPrefix = normalizedRootFolder.endsWith('/') ? normalizedRootFolder : `${normalizedRootFolder}/`

  const filteredFiles = files.filter((file) => {
    const normalizedFilePath = normalizePath(file.path)
    return rootFolder ? normalizedFilePath.startsWith(rootPrefix) && !normalizedFilePath.endsWith('.json') : !normalizedFilePath.endsWith('.json')
  })

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
          // If its the last part, its a file
          existingNode = {
            name: part,
            file,
            path: currentPath,
          } as DirectoryTree
        } else {
          // Otherwise, its a folder
          existingNode = {
            name: part,
            path: currentPath,
            children: [],
          } as DirectoryTree
        }
        currentLevel.push(existingNode)
      }

      // Move to the next level if its a folder
      if (!existingNode.file) {
        currentLevel = existingNode.children
      }
    })
  })

  return root
}
