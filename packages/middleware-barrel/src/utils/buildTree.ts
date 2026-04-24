import { posix } from 'node:path'

/**
 * A node in a directory tree used to compute barrel file exports.
 *
 * Each `TreeNode` represents either a directory or a file entry.
 * Directory nodes have `children`; file nodes have an empty `children` array.
 */
export type BuildTree = {
  /**
   * Absolute path of the directory (root of this subtree) or file.
   */
  path: string
  /**
   * Child nodes (sub-directories and files) within this directory.
   */
  children: Array<BuildTree>
  /**
   * `true` when this node represents a file (leaf node).
   */
  isFile: boolean
}

/**
 * Builds a `TreeNode` directory tree from a list of absolute file paths.
 *
 * All `filePaths` must be inside `rootPath`. Paths that are outside
 * the root or that equal the root are silently ignored.
 *
 * @example
 * ```ts
 * const tree = buildTree('/src/gen/types', [
 *   '/src/gen/types/pet.ts',
 *   '/src/gen/types/user.ts',
 *   '/src/gen/types/pets/listPets.ts',
 * ])
 * ```
 */
export function buildTree(rootPath: string, filePaths: ReadonlyArray<string>): BuildTree {
  const root: BuildTree = { path: rootPath, children: [], isFile: false }

  for (const filePath of filePaths) {
    // Only include files inside rootPath
    if (!filePath.startsWith(rootPath + posix.sep) && !filePath.startsWith(rootPath + '/')) {
      continue
    }

    const relative = filePath.slice(rootPath.length).replace(/^\//g, '').replace(/^\\/g, '')
    const parts = relative.split(/[/\\]/).filter(Boolean)

    let current = root
    for (let i = 0; i < parts.length; i++) {
      const isLast = i === parts.length - 1
      const part = parts[i]!
      const childPath = `${current.path}/${part}`

      let child = current.children.find((c) => c.path === childPath)
      if (!child) {
        child = { path: childPath, children: [], isFile: isLast }
        current.children.push(child)
      }
      current = child
    }
  }

  return root
}
