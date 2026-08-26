import type { Operation } from '@kubb/adapter-oas'
import { getOperationId } from '@kubb/adapter-oas/internal'
import { Diagnostics } from '@kubb/core'
import { COMPONENT_EXPRESSION, OPERATION_PATH_EXPRESSION, SOURCE_EXPRESSION } from '../constants.ts'
import type { ArazzoDocument, FailureActionObject, ParameterObject, ResolvedStep, ReusableObject, StepObject, SuccessActionObject } from '../types.ts'
import type { LoadedSource } from './sources.ts'

/**
 * Unescapes one RFC 6901 pointer token (`~1` to `/`, `~0` to `~`). Both an `operationPath` and the
 * pointer half of a runtime expression are made of them.
 */
export function unescapePointerToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~')
}

/**
 * Reads the path and method out of an `operationPath` pointer such as `/paths/~1pet/get`.
 */
function parseOperationPointer(pointer: string): { path: string; method: string } | null {
  const segments = pointer.split('/').filter(Boolean).map(unescapePointerToken)
  if (segments.length !== 3 || segments[0] !== 'paths') {
    return null
  }

  return { path: segments[1]!, method: segments[2]!.toLowerCase() }
}

/**
 * Finds the source that holds an operation, and the operation itself.
 *
 * A step may name its source (`$sourceDescriptions.petStore.loginUser`) or give a bare
 * `operationId`, in which case every loaded source is searched in document order.
 */
function findOperation({
  operationId,
  sources,
}: {
  operationId: string
  sources: Map<string, LoadedSource>
}): { sourceName: string; operation: Operation } | null {
  const expression = SOURCE_EXPRESSION.exec(operationId)

  if (expression) {
    const [, sourceName, id] = expression
    const operation = sources.get(sourceName!)?.operations.get(id!)
    return operation ? { sourceName: sourceName!, operation } : null
  }

  for (const [sourceName, source] of sources) {
    const operation = source.operations.get(operationId)
    if (operation) return { sourceName, operation }
  }

  return null
}

/**
 * Finds the operation an `operationPath` points at by walking to its path and method.
 */
function findOperationByPath({
  operationPath,
  sources,
}: {
  operationPath: string
  sources: Map<string, LoadedSource>
}): { sourceName: string; operation: Operation } | null {
  const expression = OPERATION_PATH_EXPRESSION.exec(operationPath)
  if (!expression) return null

  const [, sourceName, pointer] = expression
  const source = sources.get(sourceName!)
  const target = parseOperationPointer(pointer!)
  if (!source || !target) return null

  for (const operation of source.operations.values()) {
    if (operation.path === target.path && operation.method.toLowerCase() === target.method) {
      return { sourceName: sourceName!, operation }
    }
  }

  return null
}

/**
 * Finds the operation a step invokes, whichever of `operationId` or `operationPath` it uses.
 */
function findStepTarget({ step, sources }: { step: StepObject; sources: Map<string, LoadedSource> }): { sourceName: string; operation: Operation } | null {
  if (step.operationId) {
    return findOperation({ operationId: step.operationId, sources })
  }
  if (step.operationPath) {
    return findOperationByPath({ operationPath: step.operationPath, sources })
  }

  return null
}

/**
 * Reports a step whose target could not be found, so an unresolvable step surfaces as a problem
 * instead of a silently untyped workflow.
 */
function reportUnresolvedStep({ step, pointer }: { step: StepObject; pointer: string }): void {
  const target = step.operationId ?? step.operationPath ?? step.channelPath ?? step.workflowId ?? '(none)'
  const diagnostic = {
    code: Diagnostics.code.refNotFound,
    severity: 'warning',
    message: `Step \`${step.stepId}\` points at \`${target}\`, which none of the loaded source descriptions define.`,
    help: 'Check the `operationId` or `operationPath` against the source description, and confirm the `sourceDescriptions` entry loads.',
    location: { kind: 'operation', pointer },
  } as const

  Diagnostics.report(diagnostic)
}

/**
 * Works out what every step in a workflow invokes.
 *
 * `channelPath` steps (AsyncAPI) resolve to nothing: this adapter reads OpenAPI source
 * descriptions only, so there is no operation to point them at.
 */
export function resolveSteps({
  workflow,
  workflowIndex,
  sources,
}: {
  workflow: { workflowId: string; steps?: Array<StepObject> }
  workflowIndex: number
  sources: Map<string, LoadedSource>
}): Array<ResolvedStep> {
  return (workflow.steps ?? []).map((step, stepIndex) => {
    if (step.workflowId) {
      const expression = SOURCE_EXPRESSION.exec(step.workflowId)
      return { step, target: { kind: 'workflow' as const, workflowId: expression ? expression[2]! : step.workflowId } }
    }

    const found = findStepTarget({ step, sources })

    if (!found) {
      reportUnresolvedStep({ step, pointer: `#/workflows/${workflowIndex}/steps/${stepIndex}` })
      return { step, target: null }
    }

    return {
      step,
      target: { kind: 'operation' as const, sourceName: found.sourceName, operationId: getOperationId(found.operation) },
    }
  })
}

/**
 * Resolves a Reusable Object (`$components.<section>.<name>`) against the components it should
 * point into, dropping an entry whose reference names a different section or a component the
 * document never declares. An entry written inline is returned as-is.
 */
function resolveReusable<T extends object>({
  entry,
  section,
  components,
}: {
  entry: T | ReusableObject
  section: string
  components: Record<string, T> | undefined
}): T | null {
  if (!('reference' in entry)) {
    return entry
  }

  const expression = COMPONENT_EXPRESSION.exec(entry.reference)
  if (!expression || expression[1] !== section) {
    return null
  }

  return components?.[expression[2]!] ?? null
}

/**
 * Resolves a step or workflow parameter, keeping the `value` override a Reusable Object may carry.
 */
export function resolveParameter({ parameter, document }: { parameter: ParameterObject | ReusableObject; document: ArazzoDocument }): ParameterObject | null {
  const resolved = resolveReusable({ entry: parameter, section: 'parameters', components: document.components?.parameters })
  if (!resolved) {
    return null
  }

  const override = 'reference' in parameter ? parameter.value : undefined

  return override === undefined ? resolved : { ...resolved, value: override }
}

/**
 * Resolves the `onSuccess` entries of a step, or the `successActions` of a workflow.
 */
export function resolveSuccessActions({
  actions,
  document,
}: {
  actions: Array<SuccessActionObject | ReusableObject> | undefined
  document: ArazzoDocument
}): Array<SuccessActionObject> {
  return (actions ?? []).flatMap((entry) => {
    const resolved = resolveReusable({ entry, section: 'successActions', components: document.components?.successActions })
    return resolved ? [resolved] : []
  })
}

/**
 * Resolves the `onFailure` entries of a step, or the `failureActions` of a workflow.
 */
export function resolveFailureActions({
  actions,
  document,
}: {
  actions: Array<FailureActionObject | ReusableObject> | undefined
  document: ArazzoDocument
}): Array<FailureActionObject> {
  return (actions ?? []).flatMap((entry) => {
    const resolved = resolveReusable({ entry, section: 'failureActions', components: document.components?.failureActions })
    return resolved ? [resolved] : []
  })
}
