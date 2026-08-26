import { ast, narrowSchema } from '@kubb/ast'
import { STEP_OUTPUT_EXPRESSION } from '../constants.ts'
import type { LoadedSource } from '../model/sources.ts'
import type { ResolvedStep, RuntimeExpression, SelectorObject } from '../types.ts'

/**
 * Everything the resolver needs to turn a runtime expression into a schema: the workflow's steps
 * (so `$steps.<id>.outputs.<name>` can be followed), the loaded source descriptions (so a step's
 * response can be parsed), and the workflow's own parsed `inputs`.
 */
export type ExpressionContext = {
  steps: Map<string, ResolvedStep>
  sources: Map<string, LoadedSource>
  inputs: ast.SchemaNode | null
  options: ast.ParserOptions
  /**
   * Parsed response schema per `stepId`, filled on first use. Parsing a target operation is the
   * expensive part of resolving an expression and several outputs usually read the same step.
   */
  responseCache: Map<string, ast.SchemaNode | null>
}

/**
 * Splits an expression into its expression part and the optional JSON pointer after `#`.
 */
function splitPointer(expression: string): { source: string; pointer: string | null } {
  const index = expression.indexOf('#')
  if (index === -1) {
    return { source: expression, pointer: null }
  }

  return { source: expression.slice(0, index), pointer: expression.slice(index + 1) }
}

/**
 * Follows one property of a schema node, stepping through a ref to its resolved target first.
 */
function propertyOf({ node, name }: { node: ast.SchemaNode; name: string }): ast.SchemaNode | null {
  const ref = narrowSchema(node, 'ref')
  if (ref) {
    return ref.schema ? propertyOf({ node: ref.schema, name }) : null
  }

  const object = narrowSchema(node, 'object')
  if (object) {
    return object.properties.find((property) => property.name === name)?.schema ?? null
  }

  const array = narrowSchema(node, 'array')
  if (array) {
    const index = Number(name)
    const items = array.items ?? []
    return (Number.isInteger(index) ? items[index] : items[0]) ?? array.rest ?? null
  }

  return null
}

/**
 * Walks an RFC 6901 pointer into a schema node, so `$response.body#/token` narrows to the
 * `token` property rather than the whole body.
 */
function walkPointer({ node, pointer }: { node: ast.SchemaNode; pointer: string }): ast.SchemaNode | null {
  return pointer
    .split('/')
    .filter(Boolean)
    .map((token) => token.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce<ast.SchemaNode | null>((current, token) => (current ? propertyOf({ node: current, name: token }) : null), node)
}

/**
 * Parses the body schema of a step's first successful response.
 *
 * The target operation is parsed by the source description's own parser, so the schema is exactly
 * the one `@kubb/adapter-oas` would emit for that operation.
 */
function responseSchemaOf({ resolved, context }: { resolved: ResolvedStep; context: ExpressionContext }): ast.SchemaNode | null {
  const { stepId } = resolved.step
  if (context.responseCache.has(stepId)) {
    return context.responseCache.get(stepId) ?? null
  }

  context.responseCache.set(stepId, null)

  const target = resolved.target
  const source = target?.kind === 'operation' ? context.sources.get(target.sourceName) : undefined
  const operation = target?.kind === 'operation' ? source?.operations.get(target.operationId) : undefined

  if (!source || !operation) {
    return null
  }

  const node = source.parser.parseOperation(context.options, operation)
  const success = node.responses.find((response) => response.statusCode.toString().startsWith('2'))
  const schema = success?.content?.[0]?.schema ?? null

  context.responseCache.set(stepId, schema)
  return schema
}

/**
 * Resolves what a step's `$response...` expression refers to.
 *
 * Headers always resolve to `string`: the AST carries no header schemas, and an HTTP header is a
 * string on the wire regardless of what the spec declares.
 */
function resolveResponse({
  rest,
  pointer,
  step,
  context,
}: {
  rest: string
  pointer: string | null
  step: ResolvedStep | null
  context: ExpressionContext
}): ast.SchemaNode | null {
  if (rest.startsWith('header.')) {
    return ast.factory.createSchema({ type: 'string' })
  }

  if (rest !== 'body' || !step) {
    return null
  }

  const body = responseSchemaOf({ resolved: step, context })
  if (!body) {
    return null
  }

  return pointer ? walkPointer({ node: body, pointer }) : body
}

/**
 * Resolves a runtime expression to the schema of the value it produces.
 *
 * `step` is the step whose `outputs` the expression was written in, which is what `$response`,
 * `$statusCode`, and `$url` refer to. At workflow level there is no such step, so only
 * `$steps.…` and `$inputs.…` resolve.
 *
 * Anything this adapter cannot follow (a Selector Object, a JSONPath, an expression reaching into
 * another workflow) resolves to the configured unknown type rather than a guess.
 *
 * @example
 * ```ts
 * resolveExpression({ expression: '$response.body#/token', step, context })
 * resolveExpression({ expression: '$steps.login.outputs.token', step: null, context })
 * ```
 */
export function resolveExpression({
  expression,
  step,
  context,
  seen = new Set<string>(),
}: {
  expression: RuntimeExpression | SelectorObject
  step: ResolvedStep | null
  context: ExpressionContext
  seen?: Set<string>
}): ast.SchemaNode {
  const unknown = ast.factory.createSchema({ type: context.options.unknownType })

  if (typeof expression !== 'string' || !expression.startsWith('$')) {
    return unknown
  }

  const { source, pointer } = splitPointer(expression)

  if (source === '$statusCode') {
    return ast.factory.createSchema({ type: 'number' })
  }

  if (source === '$url' || source === '$method') {
    return ast.factory.createSchema({ type: 'string' })
  }

  if (source.startsWith('$response.')) {
    return resolveResponse({ rest: source.slice('$response.'.length), pointer, step, context }) ?? unknown
  }

  if (source.startsWith('$inputs.')) {
    const name = source.slice('$inputs.'.length)
    const node = context.inputs ? propertyOf({ node: context.inputs, name }) : null
    if (!node) return unknown
    return (pointer ? walkPointer({ node, pointer }) : node) ?? unknown
  }

  const stepOutput = STEP_OUTPUT_EXPRESSION.exec(source)
  if (!stepOutput) {
    return unknown
  }

  const [, stepId, outputName] = stepOutput
  if (seen.has(source)) {
    return unknown
  }
  seen.add(source)

  const referenced = context.steps.get(stepId!)
  const referencedExpression = referenced?.step.outputs?.[outputName!]
  if (!referenced || referencedExpression === undefined) {
    return unknown
  }

  const node = resolveExpression({ expression: referencedExpression, step: referenced, context, seen })
  return (pointer ? walkPointer({ node, pointer }) : node) ?? unknown
}
