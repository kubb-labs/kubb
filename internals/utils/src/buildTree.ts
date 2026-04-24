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
 * Paths outside `rootPath` are silently ignored. Children are sorted alphabetically
 * by path so consumers (barrel exports, propagated indexes) emit a deterministic order.
 *
 * Both POSIX (`/`) and Windows (`\`) separators are accepted in input paths.
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
  // Per-directory child lookup avoids the O(N) `Array.find` scan during insertion.
  const childIndex = new Map<BuildTree, Map<string, BuildTree>>()
  childIndex.set(root, new Map())

  const normalizedRoot = rootPath.replaceAll('\\', '/')
  const rootPrefix = `${normalizedRoot}/`

  for (const filePath of filePaths) {
    const normalized = filePath.replaceAll('\\', '/')
    if (!normalized.startsWith(rootPrefix)) continue

    const parts = normalized.slice(rootPrefix.length).split('/')
    if (parts.length === 0) continue

    let current = root
    const lastIndex = parts.length - 1
    for (const [i, part] of parts.entries()) {
      if (!part) continue

      const isLast = i === lastIndex
      const siblings = childIndex.get(current)!
      let child = siblings.get(part)
      if (!child) {
        child = { path: `${current.path}/${part}`, children: [], isFile: isLast }
        current.children.push(child)
        siblings.set(part, child)
        if (!isLast) childIndex.set(child, new Map())
      }
      current = child
    }
  }

  sortTree(root)

  return root
}

function sortTree(node: BuildTree): void {
  if (node.children.length === 0) return
  node.children.sort(compareByPath)
  for (const child of node.children) {
    if (!child.isFile) sortTree(child)
  }
}

function compareByPath(a: BuildTree, b: BuildTree): number {
  return a.path < b.path ? -1 : a.path > b.path ? 1 : 0
}
