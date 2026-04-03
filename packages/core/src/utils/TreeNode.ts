import path from 'node:path'
import type * as KubbFile from '../KubbFile.ts'
import { getMode } from '../PluginDriver.ts'

type BarrelData = {
  file?: KubbFile.File
  /**
   * @deprecated use file instead
   */
  type: KubbFile.Mode
  path: string
  name: string
}

/**
 * Tree structure used to build per-directory barrel (`index.ts`) files from a
 * flat list of generated {@link KubbFile.File} entries.
 *
 * Each node represents either a directory or a file within the output tree.
 * Use {@link TreeNode.build} to construct a root node from a file list, then
 * traverse with {@link TreeNode.forEach}, {@link TreeNode.leaves}, or the
 * `*Deep` helpers.
 */
export class TreeNode {
  data: BarrelData
  parent?: TreeNode
  children: Array<TreeNode> = []
  #cachedLeaves?: Array<TreeNode> = undefined

  constructor(data: BarrelData, parent?: TreeNode) {
    this.data = data
    this.parent = parent
  }

  addChild(data: BarrelData): TreeNode {
    const child = new TreeNode(data, this)
    if (!this.children) {
      this.children = []
    }
    this.children.push(child)
    return child
  }

  /**
   * Returns the root ancestor of this node, walking up via `parent` links.
   */
  get root(): TreeNode {
    if (!this.parent) {
      return this
    }
    return this.parent.root
  }

  /**
   * Returns all leaf descendants (nodes with no children) of this node.
   *
   * Results are cached after the first traversal.
   */
  get leaves(): Array<TreeNode> {
    if (!this.children || this.children.length === 0) {
      // this is a leaf
      return [this]
    }

    if (this.#cachedLeaves) {
      return this.#cachedLeaves
    }

    const leaves: TreeNode[] = []
    for (const child of this.children) {
      leaves.push(...child.leaves)
    }

    this.#cachedLeaves = leaves

    return leaves
  }

  /**
   * Visits this node and every descendant in depth-first order.
   */
  forEach(callback: (treeNode: TreeNode) => void): this {
    if (typeof callback !== 'function') {
      throw new TypeError('forEach() callback must be a function')
    }

    callback(this)

    for (const child of this.children) {
      child.forEach(callback)
    }

    return this
  }

  /**
   * Finds the first leaf that satisfies `predicate`, or `undefined` when none match.
   */
  findDeep(predicate?: (value: TreeNode, index: number, obj: TreeNode[]) => boolean): TreeNode | undefined {
    if (typeof predicate !== 'function') {
      throw new TypeError('find() predicate must be a function')
    }

    return this.leaves.find(predicate)
  }

  /**
   * Calls `callback` for every leaf of this node.
   */
  forEachDeep(callback: (treeNode: TreeNode) => void): void {
    if (typeof callback !== 'function') {
      throw new TypeError('forEach() callback must be a function')
    }

    this.leaves.forEach(callback)
  }

  /**
   * Returns all leaves that satisfy `callback`.
   */
  filterDeep(callback: (treeNode: TreeNode) => boolean): Array<TreeNode> {
    if (typeof callback !== 'function') {
      throw new TypeError('filter() callback must be a function')
    }

    return this.leaves.filter(callback)
  }

  /**
   * Maps every leaf through `callback` and returns the resulting array.
   */
  mapDeep<T>(callback: (treeNode: TreeNode) => T): Array<T> {
    if (typeof callback !== 'function') {
      throw new TypeError('map() callback must be a function')
    }

    return this.leaves.map(callback)
  }

  /**
   * Builds a {@link TreeNode} tree from a flat list of files.
   *
   * - Filters to files under `root` (when provided) and skips `.json` files.
   * - Returns `null` when no files match.
   */
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

type DirectoryTree = {
  name: string
  path: string
  file?: KubbFile.File
  children: Array<DirectoryTree>
}

const normalizePath = (p: string): string => p.replaceAll('\\', '/')

function buildDirectoryTree(files: Array<KubbFile.File>, rootFolder = ''): DirectoryTree | null {
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
    const relativePath = file.path.slice(rootFolder.length)
    const parts = relativePath.split('/').filter(Boolean)
    let currentLevel: DirectoryTree[] = root.children
    let currentPath = normalizePath(rootFolder)

    parts.forEach((part, index) => {
      currentPath = path.posix.join(currentPath, part)

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
