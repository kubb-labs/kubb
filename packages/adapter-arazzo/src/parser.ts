import { pascalCase } from '@internals/utils'
import type { Document, SchemaObject } from '@kubb/adapter-oas'
import { createRefs, createSchemaParser } from '@kubb/adapter-oas/internal'
import { ast } from '@kubb/ast'
import { resolveExpression } from './emit/expression.ts'
import type { ExpressionContext } from './emit/expression.ts'
import type { LoadedSource } from './model/sources.ts'
import { resolveFailureActions, resolveParameter, resolveSteps, resolveSuccessActions } from './model/workflows.ts'
import type { ArazzoDocument, ArazzoOperationNode, ParameterObject, ResolvedStep, StepMeta, WorkflowObject } from './types.ts'

/**
 * Name of the schema holding a workflow's `inputs`, for example `LoginUserInputs`.
 */
function inputsName(workflowId: string): string {
  return `${pascalCase(workflowId)}Inputs`
}

/**
 * Name of the schema holding a workflow's `outputs`, for example `LoginUserOutputs`.
 */
function outputsName(workflowId: string): string {
  return `${pascalCase(workflowId)}Outputs`
}

/**
 * Points a workflow's request body or response at the named schema emitted for it, so plugins
 * import the type instead of inlining a second copy of it.
 */
function refTo({ name, pointer, schema }: { name: string; pointer: string; schema: ast.SchemaNode }): ast.SchemaNode {
  return ast.factory.createSchema({ type: 'ref', name, ref: pointer, targetName: name, schema })
}

/**
 * Resolves a list of parameters, dropping any Reusable Object that points at nothing.
 */
function toParameters({ parameters, document }: { parameters: WorkflowObject['parameters']; document: ArazzoDocument }): Array<ParameterObject> {
  return (parameters ?? []).flatMap((parameter) => {
    const resolved = resolveParameter({ parameter, document })
    return resolved ? [resolved] : []
  })
}

/**
 * Layers a step's own entries over the workflow-level defaults, keyed by `key`. A step entry with
 * the same key replaces the workflow's, which is how Arazzo scopes `parameters` and the
 * success/failure actions a workflow declares for all its steps.
 */
function overrideByKey<T>({ defaults, own, key }: { defaults: Array<T>; own: Array<T>; key: (entry: T) => string }): Array<T> {
  const merged = new Map(defaults.map((entry) => [key(entry), entry]))
  for (const entry of own) {
    merged.set(key(entry), entry)
  }

  return [...merged.values()]
}

/**
 * Flattens a step into the metadata carried on the workflow's node: what it calls, what it sends,
 * where it goes next, and the runtime expressions it reads, all as written in the document.
 */
function toStepMeta({ resolved, workflow, document }: { resolved: ResolvedStep; workflow: WorkflowObject; document: ArazzoDocument }): StepMeta {
  const { step, target } = resolved

  return {
    stepId: step.stepId,
    description: step.description,
    sourceName: target?.kind === 'operation' ? target.sourceName : undefined,
    operationId: target?.kind === 'operation' ? target.operationId : undefined,
    workflowId: target?.kind === 'workflow' ? target.workflowId : undefined,
    parameters: overrideByKey({
      defaults: toParameters({ parameters: workflow.parameters, document }),
      own: toParameters({ parameters: step.parameters, document }),
      key: (parameter) => `${parameter.in ?? ''}:${parameter.name}`,
    }),
    requestBody: step.requestBody,
    successCriteria: step.successCriteria ?? [],
    onSuccess: overrideByKey({
      defaults: resolveSuccessActions({ actions: workflow.successActions, document }),
      own: resolveSuccessActions({ actions: step.onSuccess, document }),
      key: (action) => action.name,
    }),
    onFailure: overrideByKey({
      defaults: resolveFailureActions({ actions: workflow.failureActions, document }),
      own: resolveFailureActions({ actions: step.onFailure, document }),
      key: (action) => action.name,
    }),
    dependsOn: step.dependsOn ?? [],
    timeout: step.timeout,
    correlationId: step.correlationId,
    outputs: step.outputs ?? {},
  }
}

/**
 * Creates the converters for one Arazzo document.
 *
 * Schema conversion is `@kubb/adapter-oas`'s: an Arazzo `inputs` object is JSON Schema, and a
 * `$ref` into `components.inputs` resolves through the same pointer walk the OpenAPI adapter uses.
 *
 * @internal
 */
export function createWorkflowParser({
  document,
  sources,
  options,
}: {
  document: ArazzoDocument
  sources: Map<string, LoadedSource>
  options: ast.ParserOptions
}) {
  // The schema layer takes an OpenAPI `Document` because that is what it was written against, but
  // it only reads `components` and JSON Schema keywords, both of which an Arazzo document has.
  const arazzoDocument = document as unknown as Document
  const refs = createRefs(arazzoDocument)
  const { parseSchema } = createSchemaParser({ document: arazzoDocument, refs })

  /**
   * Converts `components.inputs`, the document's reusable JSON Schemas.
   */
  function parseComponentInputs(): Array<ast.SchemaNode> {
    return Object.entries(document.components?.inputs ?? {}).map(([name, schema]) => parseSchema({ schema, name }, options))
  }

  /**
   * Builds the object schema for a workflow's `outputs` by resolving each runtime expression.
   * Outputs are always present once the workflow ran, so every property is required.
   */
  function parseOutputs({ workflow, context }: { workflow: WorkflowObject; context: ExpressionContext }): ast.SchemaNode | null {
    const entries = Object.entries(workflow.outputs ?? {})
    if (entries.length === 0) {
      return null
    }

    return ast.factory.createSchema({
      type: 'object',
      name: outputsName(workflow.workflowId),
      properties: entries.map(([name, expression]) =>
        ast.factory.createProperty({
          name,
          required: true,
          schema: resolveExpression({ expression, step: null, context }),
        }),
      ),
    })
  }

  /**
   * Converts one workflow into its named schemas and the operation node that carries its steps.
   */
  function parseWorkflow({ workflow, index }: { workflow: WorkflowObject; index: number }): {
    schemas: Array<ast.SchemaNode>
    operation: ArazzoOperationNode
  } {
    const { workflowId } = workflow

    const inputs = workflow.inputs ? parseSchema({ schema: workflow.inputs as SchemaObject, name: inputsName(workflowId) }, options) : null

    const resolvedSteps = resolveSteps({ workflow, workflowIndex: index, sources })
    const context: ExpressionContext = {
      steps: new Map(resolvedSteps.map((resolved) => [resolved.step.stepId, resolved])),
      sources,
      inputs,
      options,
    }

    const outputs = parseOutputs({ workflow, context })
    const schemas = [inputs, outputs].filter((node): node is ast.SchemaNode => node !== null)

    const operation: ArazzoOperationNode = {
      ...ast.factory.createOperation({
        operationId: workflowId,
        protocol: 'arazzo',
        tags: [],
        summary: workflow.summary,
        description: workflow.description,
        parameters: [],
        requestBody: inputs
          ? {
              required: true,
              content: [
                ast.factory.createContent({
                  contentType: 'application/json',
                  schema: refTo({ name: inputsName(workflowId), pointer: `#/workflows/${workflowId}/inputs`, schema: inputs }),
                }),
              ],
            }
          : undefined,
        responses: outputs
          ? [
              ast.factory.createResponse({
                statusCode: '200',
                description: `Outputs of the \`${workflowId}\` workflow.`,
                content: [
                  ast.factory.createContent({
                    contentType: 'application/json',
                    schema: refTo({ name: outputsName(workflowId), pointer: `#/workflows/${workflowId}/outputs`, schema: outputs }),
                  }),
                ],
              }),
            ]
          : [],
      }),
      protocol: 'arazzo',
      dependsOn: workflow.dependsOn ?? [],
      steps: resolvedSteps.map((resolved) => toStepMeta({ resolved, workflow, document })),
    }

    return { schemas, operation }
  }

  return { parseComponentInputs, parseWorkflow }
}
