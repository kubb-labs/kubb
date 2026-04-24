/**
 * Converts a filesystem path to use POSIX (`/`) separators.
 *
 * Most of the codebase compares and composes paths as strings (prefix matching, joining for
 * import specifiers, splitting on `/`). On POSIX `path.resolve` already returns `/`-separated
 * paths, but on Windows it returns `\`-separated paths, which breaks every such comparison.
 *
 * Routing every path that crosses a module boundary through `toPosixPath` keeps the rest of the
 * code platform-agnostic. The conversion runs unconditionally so Windows-specific behavior is
 * exercisable from POSIX CI.
 *
 * @example
 * toPosixPath('C:\\repo\\src\\pet.ts') // 'C:/repo/src/pet.ts'
 */
export function toPosixPath(filePath: string): string {
  return filePath.replaceAll('\\', '/')
}
