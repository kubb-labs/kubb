import type { BaseNode } from './base.ts'
import type { ParameterNode } from './parameter.ts'
import type { SchemaNode } from './schema.ts'

/**
 * AST node representing one step in a {@link WorkflowNode} — a single referenced
 * operation call within a workflow (Arazzo `step`).
 *
 * @example
 * ```ts
 * const step: StepNode = {
 *   kind: 'Step',
 *   stepId: 'createPet',
 *   operationId: 'addPet',
 * }
 * ```
 */
export type StepNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Step'
  /**
   * Step identifier, unique within its workflow.
   */
  stepId: string
  /**
   * Human-readable step description.
   */
  description?: string
  /**
   * Identifier of the operation this step invokes (when referenced by id).
   */
  operationId?: string
  /**
   * Reference to the operation this step invokes (when referenced by `$ref`/path).
   */
  operationRef?: string
  /**
   * Parameters passed to the referenced operation.
   */
  parameters?: Array<ParameterNode>
}

/**
 * AST node representing a workflow — an ordered sequence of {@link StepNode}s
 * (Arazzo `workflow`). Spec families without workflows never emit this node.
 *
 * @example
 * ```ts
 * const workflow: WorkflowNode = {
 *   kind: 'Workflow',
 *   workflowId: 'adoptAPet',
 *   steps: [{ kind: 'Step', stepId: 'createPet', operationId: 'addPet' }],
 * }
 * ```
 */
export type WorkflowNode = BaseNode & {
  /**
   * Node kind.
   */
  kind: 'Workflow'
  /**
   * Workflow identifier.
   */
  workflowId: string
  /**
   * Short one-line workflow summary.
   */
  summary?: string
  /**
   * Full workflow description.
   */
  description?: string
  /**
   * Schema describing the workflow inputs.
   */
  inputs?: SchemaNode
  /**
   * Ordered steps that make up the workflow.
   */
  steps: Array<StepNode>
}
