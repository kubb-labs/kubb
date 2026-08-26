import { assertInputExists, bundleDocument } from '@kubb/adapter-oas/internal'
import { Diagnostics } from '@kubb/core'
import type { AdapterSource, ProblemDiagnostic } from '@kubb/core'
import { parse } from 'yaml'
import type { ArazzoDocument, StepObject } from '../types.ts'

/**
 * Creates an `ArazzoDocument` from an `AdapterSource`.
 *
 * A path or URL goes through `api-ref-bundler` so a `$ref` into another file resolves, the same
 * way `@kubb/adapter-oas` loads an OpenAPI document. Nothing is up-converted: Arazzo has one major
 * version and no equivalent of the Swagger 2.0 to OpenAPI 3.1 upgrade path.
 *
 * `sourceDescriptions[].url` is not a `$ref`, so bundling leaves it alone. `model/sources.ts`
 * resolves those.
 *
 * @example
 * ```ts
 * const document = await parseFromConfig({ type: 'path', path: '/abs/workflows.arazzo.yaml' })
 * const document = await parseFromConfig({ type: 'data', data: '{"arazzo":"1.1.0",...}' })
 * ```
 */
export async function parseFromConfig(source: AdapterSource): Promise<ArazzoDocument> {
  if (source.type === 'data') {
    const data = typeof source.data === 'string' ? parse(source.data) : structuredClone(source.data)
    return data as ArazzoDocument
  }

  if (!URL.canParse(source.path)) {
    await assertInputExists(source.path)
  }

  return (await bundleDocument(source.path)) as unknown as ArazzoDocument
}

/**
 * Asserts the parsed input is an Arazzo document.
 *
 * {@link validateDocument} keeps structural problems non-fatal so an imperfect but usable document
 * still generates. A missing `arazzo` version field is the one failure that cannot be a usable
 * document, so it is fatal regardless of the `validate` option.
 */
export function assertDocument(document: ArazzoDocument): void {
  if (document && 'arazzo' in document) return

  throw new Diagnostics.Error({
    code: Diagnostics.code.invalidDocument,
    severity: 'error',
    message: 'The resolved `input` is not an Arazzo document: it declares no `arazzo` version.',
    help: 'Point `input` at a document that declares `arazzo`. For an OpenAPI or Swagger document, use `@kubb/adapter-oas` instead.',
    location: { kind: 'config' },
  })
}

/**
 * Whether a step names exactly one of the four fields that say what it invokes. Arazzo makes them
 * mutually exclusive and requires one.
 */
function hasOneTarget(step: StepObject): boolean {
  return (['operationId', 'operationPath', 'channelPath', 'workflowId'] as const).filter((field) => step[field] !== undefined).length === 1
}

/**
 * Reports the structural problems that would otherwise surface as an empty build: no workflows,
 * duplicate ids, or a step that names no target (or more than one).
 *
 * Reports land in the active build and generation continues. Outside a build, or with
 * `throwOnError`, the first problem throws instead.
 */
export function validateDocument(document: ArazzoDocument, { throwOnError = false }: { throwOnError?: boolean } = {}): void {
  const report = (message: string, help: string, pointer: string) => {
    const problem: ProblemDiagnostic = {
      code: Diagnostics.code.invalidDocument,
      severity: 'error',
      message,
      help,
      location: { kind: 'document', pointer },
    }

    if (throwOnError || !Diagnostics.report(problem)) {
      throw new Diagnostics.Error(problem)
    }
  }

  if (!Array.isArray(document.workflows) || document.workflows.length === 0) {
    report(
      'The Arazzo document declares no `workflows`.',
      'Add at least one entry to `workflows`, each with a `workflowId` and one or more `steps`.',
      '#/workflows',
    )
  }

  if (!Array.isArray(document.sourceDescriptions) || document.sourceDescriptions.length === 0) {
    report(
      'The Arazzo document declares no `sourceDescriptions`.',
      'Add at least one entry to `sourceDescriptions` pointing at the OpenAPI document its steps call.',
      '#/sourceDescriptions',
    )
  }

  const seenWorkflows = new Set<string>()
  for (const [index, workflow] of (document.workflows ?? []).entries()) {
    if (seenWorkflows.has(workflow.workflowId)) {
      report(`Duplicate \`workflowId\` \`${workflow.workflowId}\`.`, 'Give every workflow a unique `workflowId`.', `#/workflows/${index}/workflowId`)
    }
    seenWorkflows.add(workflow.workflowId)

    const seenSteps = new Set<string>()
    for (const [stepIndex, step] of (workflow.steps ?? []).entries()) {
      const pointer = `#/workflows/${index}/steps/${stepIndex}`

      if (seenSteps.has(step.stepId)) {
        report(
          `Duplicate \`stepId\` \`${step.stepId}\` in workflow \`${workflow.workflowId}\`.`,
          'Give every step a unique `stepId` within its workflow.',
          `${pointer}/stepId`,
        )
      }
      seenSteps.add(step.stepId)

      if (!hasOneTarget(step)) {
        report(
          `Step \`${step.stepId}\` does not name exactly one of \`operationId\`, \`operationPath\`, \`channelPath\`, or \`workflowId\`.`,
          'Set exactly one of them so the step says what it invokes.',
          pointer,
        )
      }
    }
  }
}
