import type { BaseNode } from './base.ts'
import type { FileNode } from './file.ts'

/**
 * Output AST node that groups all generated file output for one API document.
 *
 * Produced by generators and consumed by the build pipeline to write files.
 *
 * @example
 * ```ts
 * const output: OutputNode = {
 *   kind: 'Output',
 *   files: [],
 * }
 * ```
 */
export type OutputNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Output'
  /**
   * Generated file nodes.
   */
  files: Array<FileNode>
}

/**
 * Creates an `OutputNode` with a stable default for `files`.
 *
 * @example
 * ```ts
 * const output = createOutput()
 * // { kind: 'Output', files: [] }
 * ```
 */
export function createOutput(overrides: Partial<Omit<OutputNode, 'kind'>> = {}): OutputNode {
  return { kind: 'Output', files: [], ...overrides }
}
