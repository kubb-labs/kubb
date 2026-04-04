import type { BaseNode } from './base.ts'
import type { ExportNode, FileNode, ImportNode, SourceNode } from './file.ts'
import type { FunctionNode } from './function.ts'

/**
 * Output AST node that groups all generated output artifacts for one API document.
 *
 * Contains file-related nodes (`FileNode`, `SourceNode`, `ImportNode`, `ExportNode`)
 * and function-related nodes (`FunctionParametersNode`, `FunctionParameterNode`, etc.).
 *
 * Produced by generators and consumed by the build pipeline to write files.
 *
 * @example
 * ```ts
 * const output: OutputNode = {
 *   kind: 'Output',
 *   files: [],
 *   sources: [],
 *   imports: [],
 *   exports: [],
 *   functions: [],
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
  /**
   * Source code fragment nodes.
   */
  sources: Array<SourceNode>
  /**
   * Import declaration nodes.
   */
  imports: Array<ImportNode>
  /**
   * Export declaration nodes.
   */
  exports: Array<ExportNode>
  /**
   * Function-related nodes (`FunctionParametersNode`, `FunctionParameterNode`, etc.).
   */
  functions: Array<FunctionNode>
}
