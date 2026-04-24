import { posix } from 'node:path'

/**
 * A node in the directory tree used to compute barrel file exports.
 * Either represents a directory (with `children`) or a file (`isFile: true`, empty `children`).
 */
export type BuildTree = {
  /**
   * Absolute filesystem path of this directory or file.
   */
  path: string
  /**
   * Sub-directories and files contained within this directory.
   * Always empty for file nodes.
   */
  children: Array<BuildTree>
  /**
   * `true` when this node represents a file (leaf), `false` for directory nodes.
   */
  isFile: boolean
}

/**
 * Builds a directory tree rooted at `rootPath` from a list of absolute file paths.
 * Paths outside `rootPath` are silently ignored.
 *
 * @example
 * ```ts
 * buildTree('/src/gen/types', [
 *   '/src/gen/types/pet.ts',
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
