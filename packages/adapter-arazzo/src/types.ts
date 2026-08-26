import type { SchemaObject } from '@kubb/adapter-oas'
import type { ast } from '@kubb/ast'
import type { AdapterFactoryOptions } from '@kubb/core'

/**
 * Runtime expression string such as `$inputs.username` or `$steps.login.outputs.token`.
 * Kept as written: resolving one to a value is the job of whatever executes the workflow.
 */
export type RuntimeExpression = string

/**
 * Selector Object (Arazzo 1.1): a runtime expression plus a JSONPath, XPath, or JSON Pointer
 * selector applied to it.
 */
export type SelectorObject = {
  context: RuntimeExpression
  selector: string
  type?: 'jsonpath' | 'xpath' | 'jsonpointer' | Record<string, unknown>
}

/**
 * An OpenAPI, AsyncAPI, or Arazzo document the workflows call into. `url` is a URI-reference
 * resolved against the location of the Arazzo document itself.
 */
export type SourceDescriptionObject = {
  name: string
  url: string
  type?: 'openapi' | 'asyncapi' | 'arazzo'
}

/**
 * One value passed to a step, either a constant, a runtime expression, or a Selector Object.
 */
export type ParameterObject = {
  name: string
  in?: 'path' | 'query' | 'querystring' | 'header' | 'cookie'
  value: unknown
}

/**
 * Pass or fail condition evaluated against a step's response.
 */
export type CriterionObject = {
  condition: string
  context?: RuntimeExpression
  type?: 'simple' | 'regex' | 'jsonpath' | 'xpath' | Record<string, unknown>
}

/**
 * Payload sent by a step, with the content type it is sent as.
 */
export type RequestBodyObject = {
  contentType?: string
  payload?: unknown
  replacements?: Array<{ target: string; value: unknown }>
}

/**
 * Reference to an entry in `components`, written as the runtime expression
 * `$components.parameters.<name>` rather than a JSON `$ref`.
 */
export type ReusableObject = {
  reference: RuntimeExpression
  value?: string
}

/**
 * What to do after a step succeeds: end the workflow, or jump to another step or workflow.
 */
export type SuccessActionObject = {
  name: string
  type: 'end' | 'goto'
  workflowId?: string
  stepId?: string
  parameters?: Array<ParameterObject | ReusableObject>
  criteria?: Array<CriterionObject>
}

/**
 * What to do after a step fails: end the workflow, retry the step, or jump elsewhere.
 */
export type FailureActionObject = {
  name: string
  type: 'end' | 'retry' | 'goto'
  workflowId?: string
  stepId?: string
  retryAfter?: number
  retryLimit?: number
  parameters?: Array<ParameterObject | ReusableObject>
  criteria?: Array<CriterionObject>
}

/**
 * One call in a workflow. Exactly one of `operationId`, `operationPath`, `channelPath`, or
 * `workflowId` names what the step invokes.
 */
export type StepObject = {
  stepId: string
  description?: string
  operationId?: string
  operationPath?: string
  channelPath?: string
  workflowId?: string
  parameters?: Array<ParameterObject | ReusableObject>
  requestBody?: RequestBodyObject
  successCriteria?: Array<CriterionObject>
  onSuccess?: Array<SuccessActionObject | ReusableObject>
  onFailure?: Array<FailureActionObject | ReusableObject>
  outputs?: Record<string, RuntimeExpression | SelectorObject>
  timeout?: number
  correlationId?: RuntimeExpression
  action?: 'send' | 'receive'
  dependsOn?: Array<string>
}

/**
 * An ordered sequence of steps with a typed `inputs` contract and named `outputs`.
 */
export type WorkflowObject = {
  workflowId: string
  summary?: string
  description?: string
  inputs?: SchemaObject
  dependsOn?: Array<string>
  parameters?: Array<ParameterObject | ReusableObject>
  steps: Array<StepObject>
  successActions?: Array<SuccessActionObject | ReusableObject>
  failureActions?: Array<FailureActionObject | ReusableObject>
  outputs?: Record<string, RuntimeExpression | SelectorObject>
}

/**
 * Reusable pieces referenced through `$components.<type>.<name>` runtime expressions.
 * Only `inputs` holds JSON Schemas.
 */
export type ComponentsObject = {
  inputs?: Record<string, SchemaObject>
  parameters?: Record<string, ParameterObject>
  successActions?: Record<string, SuccessActionObject>
  failureActions?: Record<string, FailureActionObject>
}

/**
 * A parsed Arazzo document.
 */
export type ArazzoDocument = {
  arazzo: string
  $self?: string
  info: {
    title: string
    version: string
    summary?: string
    description?: string
  }
  sourceDescriptions: Array<SourceDescriptionObject>
  workflows: Array<WorkflowObject>
  components?: ComponentsObject
} & Record<string, unknown>

/**
 * What a step ended up calling, worked out from `operationId`, `operationPath`, or `workflowId`.
 * `target` is `null` when the step names something this adapter could not resolve.
 */
export type ResolvedStep = {
  step: StepObject
  target: { kind: 'operation'; sourceName: string; operationId: string } | { kind: 'workflow'; workflowId: string } | null
}

/**
 * Step metadata carried on the workflow's `OperationNode`.
 *
 * Runtime expressions stay as written. A plugin that emits a workflow runner reads them; nothing
 * in Kubb evaluates them.
 */
export type StepMeta = {
  stepId: string
  description?: string
  /**
   * `name` of the `sourceDescriptions` entry the target operation was found in.
   */
  sourceName?: string
  /**
   * `operationId` of the operation this step calls, after resolving `operationId` or `operationPath`.
   */
  operationId?: string
  /**
   * `workflowId` this step calls, when the step invokes another workflow instead of an operation.
   */
  workflowId?: string
  /**
   * The step's own parameters, merged over the ones the workflow declares for all its steps.
   * A step parameter with the same `name` and `in` wins.
   */
  parameters: Array<ParameterObject>
  requestBody?: RequestBodyObject
  successCriteria: Array<CriterionObject>
  /**
   * Actions to take when the step succeeds, merged over the workflow's `successActions`.
   */
  onSuccess: Array<SuccessActionObject>
  /**
   * Actions to take when the step fails, merged over the workflow's `failureActions`.
   */
  onFailure: Array<FailureActionObject>
  /**
   * `stepId`s that must run before this step.
   */
  dependsOn: Array<string>
  /**
   * Milliseconds to wait for the step's call before it counts as failed.
   */
  timeout?: number
  correlationId?: RuntimeExpression
  outputs: Record<string, RuntimeExpression | SelectorObject>
}

/**
 * The `OperationNode` this adapter emits for one workflow: a generic (non-HTTP) operation
 * carrying the workflow's steps.
 *
 * @example
 * ```ts
 * const workflows = input.operations.filter((node): node is ArazzoOperationNode => node.protocol === 'arazzo')
 * workflows[0].steps.map((step) => step.operationId)
 * ```
 */
export type ArazzoOperationNode = ast.GenericOperationNode & {
  protocol: 'arazzo'
  /**
   * The workflow's steps, in the order the document declares them.
   */
  steps: Array<StepMeta>
  /**
   * `workflowId`s that must run before this workflow.
   */
  dependsOn: Array<string>
}

/**
 * Configuration for the Arazzo adapter.
 *
 * @example
 * ```ts
 * adapterArazzo({ validate: false, dateType: 'date' })
 * ```
 */
export type AdapterArazzoOptions = {
  /**
   * Check the document's structure before parsing: version field, workflow and step ids, and
   * what each step points at. Set to `false` to generate from a document you know is imperfect.
   *
   * @default true
   */
  validate?: boolean
  /**
   * Preferred media type when a referenced operation declares several. Defaults to the first
   * JSON-compatible media type in the source description.
   */
  contentType?: string
} & Partial<ast.ParserOptions>

/**
 * Adapter options after defaults have been applied.
 */
export type AdapterArazzoResolvedOptions = {
  validate: boolean
  contentType: AdapterArazzoOptions['contentType']
  dateType: NonNullable<AdapterArazzoOptions['dateType']>
  integerType: NonNullable<AdapterArazzoOptions['integerType']>
  unknownType: NonNullable<AdapterArazzoOptions['unknownType']>
  emptySchemaType: NonNullable<AdapterArazzoOptions['emptySchemaType']>
  enumSuffix: AdapterArazzoOptions['enumSuffix']
}

/**
 * `@kubb/core` adapter factory type for the Arazzo adapter.
 */
export type AdapterArazzo = AdapterFactoryOptions<'arazzo', AdapterArazzoOptions, AdapterArazzoResolvedOptions, ArazzoDocument>
