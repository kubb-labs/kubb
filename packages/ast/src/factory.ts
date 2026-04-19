import { createHash } from 'node:crypto'
import path from 'node:path'
import { trimExtName } from '@internals/utils'
import type { InferSchemaNode } from './infer.ts'
import type {
  ArrowFunctionNode,
  BreakNode,
  ConstNode,
  ExportNode,
  FileNode,
  FunctionNode,
  FunctionParameterNode,
  FunctionParametersNode,
  ImportNode,
  InputNode,
  JsxNode,
  ObjectSchemaNode,
  OperationNode,
  OutputNode,
  ParameterGroupNode,
  ParameterNode,
  ParamsTypeNode,
  PrimitiveSchemaType,
  PropertyNode,
  ResponseNode,
  SchemaNode,
  SourceNode,
  TextNode,
  TypeNode,
} from './nodes/index.ts'
import { combineExports, combineImports, combineSources, extractStringsFromNodes } from './utils.ts'

/**
 * Syncs property/parameter schema optionality flags from `required` and `schema.nullable`.
 *
 * - `optional` is set for non-required, non-nullable schemas.
 * - `nullish` is set for non-required, nullable schemas.
 */
export function syncOptionality(schema: SchemaNode, required: boolean): SchemaNode {
  const nullable = schema.nullable ?? false

  return {
    ...schema,
    optional: !required && !nullable ? true : undefined,
    nullish: !required && nullable ? true : undefined,
  }
}

/**
 * Distributive `Omit` that preserves each member of a union.
 *
 * @example
 * ```ts
 * type A = { kind: 'a'; keep: string; drop: number }
 * type B = { kind: 'b'; keep: boolean; drop: number }
 * type Result = DistributiveOmit<A | B, 'drop'>
 * // -> { kind: 'a'; keep: string } | { kind: 'b'; keep: boolean }
 * ```
 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

type CreateSchemaObjectInput = Omit<ObjectSchemaNode, 'kind' | 'properties' | 'primitive'> & { properties?: Array<PropertyNode>; primitive?: 'object' }
type CreateSchemaInput = CreateSchemaObjectInput | DistributiveOmit<Exclude<SchemaNode, ObjectSchemaNode>, 'kind'>
type CreateSchemaOutput<T extends CreateSchemaInput> = InferSchemaNode<T> & {
  kind: 'Schema'
}

/**
 * Creates an `InputNode` with stable defaults for `schemas` and `operations`.
 *
 * @example
 * ```ts
 * const input = createInput()
 * // { kind: 'Input', schemas: [], operations: [] }
 * ```
 *
 * @example
 * ```ts
 * const input = createInput({ schemas: [petSchema] })
 * // keeps default operations: []
 * ```
 */
export function createInput(overrides: Partial<Omit<InputNode, 'kind'>> = {}): InputNode {
  return {
    schemas: [],
    operations: [],
    ...overrides,
    kind: 'Input',
  }
}

/**
 * Creates an `OutputNode` with a stable default for `files`.
 *
 * @example
 * ```ts
 * const output = createOutput()
 * // { kind: 'Output', files: [] }
 * ```
 *
 * @example
 * ```ts
 * const output = createOutput({ files: [petFile] })
 * ```
 */
export function createOutput(overrides: Partial<Omit<OutputNode, 'kind'>> = {}): OutputNode {
  return {
    files: [],
    ...overrides,
    kind: 'Output',
  }
}

/**
 * Creates an `OperationNode` with default empty arrays for `tags`, `parameters`, and `responses`.
 *
 * @example
 * ```ts
 * const operation = createOperation({
 *   operationId: 'getPetById',
 *   method: 'GET',
 *   path: '/pet/{petId}',
 * })
 * // tags, parameters, and responses are []
 * ```
 *
 * @example
 * ```ts
 * const operation = createOperation({
 *   operationId: 'findPets',
 *   method: 'GET',
 *   path: '/pet/findByStatus',
 *   tags: ['pet'],
 * })
 * ```
 */
export function createOperation(
  props: Pick<OperationNode, 'operationId' | 'method' | 'path'> & Partial<Omit<OperationNode, 'kind' | 'operationId' | 'method' | 'path'>>,
): OperationNode {
  return {
    tags: [],
    parameters: [],
    responses: [],
    ...props,
    kind: 'Operation',
  }
}

/**
 * Maps schema `type` to its underlying `primitive`.
 * Primitive types map to themselves; special string formats map to `'string'`.
 * Complex types (`ref`, `enum`, `union`, `intersection`, `tuple`, `blob`) are left unset.
 */
const TYPE_TO_PRIMITIVE: Partial<Record<SchemaNode['type'], PrimitiveSchemaType>> = {
  string: 'string',
  number: 'number',
  integer: 'integer',
  bigint: 'bigint',
  boolean: 'boolean',
  null: 'null',
  any: 'any',
  unknown: 'unknown',
  void: 'void',
  never: 'never',
  object: 'object',
  array: 'array',
  date: 'date',
  uuid: 'string',
  email: 'string',
  url: 'string',
  datetime: 'string',
  time: 'string',
}

/**
 * Creates a `SchemaNode`, narrowed to the variant of `props.type`.
 * For object schemas, `properties` defaults to an empty array.
 * `primitive` is automatically inferred from `type` when not explicitly provided.
 *
 * @example
 * ```ts
 * const scalar = createSchema({ type: 'string' })
 * // { kind: 'Schema', type: 'string', primitive: 'string' }
 * ```
 *
 * @example
 * ```ts
 * const uuid = createSchema({ type: 'uuid' })
 * // { kind: 'Schema', type: 'uuid', primitive: 'string' }
 * ```
 *
 * @example
 * ```ts
 * const object = createSchema({ type: 'object' })
 * // { kind: 'Schema', type: 'object', primitive: 'object', properties: [] }
 * ```
 *
 * @example
 * ```ts
 * const enumSchema = createSchema({
 *   type: 'enum',
 *   primitive: 'string',
 *   enumValues: ['available', 'pending'],
 * })
 * ```
 */
export function createSchema<T extends CreateSchemaInput>(props: T): CreateSchemaOutput<T>
export function createSchema(props: CreateSchemaInput): SchemaNode
export function createSchema(props: CreateSchemaInput): SchemaNode {
  const inferredPrimitive = TYPE_TO_PRIMITIVE[props.type as keyof typeof TYPE_TO_PRIMITIVE]

  if (props['type'] === 'object') {
    return {
      properties: [],
      primitive: 'object',
      ...props,
      kind: 'Schema',
    } as CreateSchemaOutput<typeof props>
  }

  return {
    primitive: inferredPrimitive,
    ...props,
    kind: 'Schema',
  } as CreateSchemaOutput<typeof props>
}

type UserPropertyNode = Pick<PropertyNode, 'name' | 'schema'> & Partial<Omit<PropertyNode, 'kind' | 'name' | 'schema'>>

/**
 * Creates a `PropertyNode`.
 *
 * `required` defaults to `false`.
 * `schema.optional` and `schema.nullish` are derived from `required` and `schema.nullable`.
 *
 * @example
 * ```ts
 * const property = createProperty({
 *   name: 'status',
 *   schema: createSchema({ type: 'string' }),
 * })
 * // required=false, schema.optional=true
 * ```
 *
 * @example
 * ```ts
 * const property = createProperty({
 *   name: 'status',
 *   required: true,
 *   schema: createSchema({ type: 'string', nullable: true }),
 * })
 * // required=true, no optional/nullish
 * ```
 */
export function createProperty(props: UserPropertyNode): PropertyNode {
  const required = props.required ?? false

  return {
    ...props,
    kind: 'Property',
    required,
    schema: syncOptionality(props.schema, required),
  }
}

/**
 * Creates a `ParameterNode`.
 *
 * `required` defaults to `false`.
 * Nested schema flags are set from `required` and `schema.nullable`.
 *
 * @example
 * ```ts
 * const param = createParameter({
 *   name: 'petId',
 *   in: 'path',
 *   required: true,
 *   schema: createSchema({ type: 'string' }),
 * })
 * ```
 *
 * @example
 * ```ts
 * const param = createParameter({
 *   name: 'status',
 *   in: 'query',
 *   schema: createSchema({ type: 'string', nullable: true }),
 * })
 * // required=false, schema.nullish=true
 * ```
 */
export function createParameter(
  props: Pick<ParameterNode, 'name' | 'in' | 'schema'> & Partial<Omit<ParameterNode, 'kind' | 'name' | 'in' | 'schema'>>,
): ParameterNode {
  const required = props.required ?? false
  return {
    ...props,
    kind: 'Parameter',
    required,
    schema: syncOptionality(props.schema, required),
  }
}

/**
 * Creates a `ResponseNode`.
 *
 * @example
 * ```ts
 * const response = createResponse({
 *   statusCode: '200',
 *   description: 'Success',
 *   schema: createSchema({ type: 'object', properties: [] }),
 * })
 * ```
 */
export function createResponse(
  props: Pick<ResponseNode, 'statusCode' | 'schema'> & Partial<Omit<ResponseNode, 'kind' | 'statusCode' | 'schema'>>,
): ResponseNode {
  return {
    ...props,
    kind: 'Response',
  }
}

/**
 * Creates a `FunctionParameterNode`.
 *
 * `optional` defaults to `false`.
 *
 * @example Required typed param
 * ```ts
 * createFunctionParameter({ name: 'petId', type: createParamsType({ variant: 'reference', name: 'string' }) })
 * // → petId: string
 * ```
 *
 * @example Optional param
 * ```ts
 * createFunctionParameter({ name: 'params', type: createParamsType({ variant: 'reference', name: 'QueryParams' }), optional: true })
 * // → params?: QueryParams
 * ```
 *
 * @example Param with default (implicitly optional; cannot combine with `optional: true`)
 * ```ts
 * createFunctionParameter({ name: 'config', type: createParamsType({ variant: 'reference', name: 'RequestConfig' }), default: '{}' })
 * // → config: RequestConfig = {}
 * ```
 */
export function createFunctionParameter(
  props: { name: string; type?: ParamsTypeNode; rest?: boolean } & ({ optional: true; default?: never } | { optional?: false; default?: string }),
): FunctionParameterNode {
  return {
    optional: false,
    ...props,
    kind: 'FunctionParameter',
  } as FunctionParameterNode
}

/**
 * Creates a {@link TypeNode} representing a language-agnostic structured type expression.
 *
 * Use `variant: 'struct'` for inline anonymous types and `variant: 'member'` for a single
 * named field accessed from a group type. Each language's printer renders the variant
 * into its own syntax (TypeScript, Python, C#, Kotlin, …).
 *
 * @example Reference type (TypeScript: `QueryParams`)
 * ```ts
 * createParamsType({ variant: 'reference', name: 'QueryParams' })
 * ```
 *
 * @example Struct type (TypeScript: `{ petId: string }`)
 * ```ts
 * createParamsType({ variant: 'struct', properties: [{ name: 'petId', optional: false, type: createParamsType({ variant: 'reference', name: 'string' }) }] })
 * ```
 *
 * @example Member type (TypeScript: `DeletePetPathParams['petId']`)
 * ```ts
 * createParamsType({ variant: 'member', base: 'DeletePetPathParams', key: 'petId' })
 * ```
 */
export function createParamsType(
  props:
    | { variant: 'reference'; name: string }
    | {
        variant: 'struct'
        properties: Array<{
          name: string
          optional: boolean
          type: ParamsTypeNode
        }>
      }
    | { variant: 'member'; base: string; key: string },
): ParamsTypeNode {
  return { ...props, kind: 'ParamsType' } as ParamsTypeNode
}

/**
 * Creates a `ParameterGroupNode` representing a group of related parameters treated as a unit.
 *
 * @example Grouped param (TypeScript declaration)
 * ```ts
 * createParameterGroup({
 *   properties: [
 *     createFunctionParameter({ name: 'id', type: createParamsType({ variant: 'reference', name: 'string' }), optional: false }),
 *     createFunctionParameter({ name: 'name', type: createParamsType({ variant: 'reference', name: 'string' }), optional: true }),
 *   ],
 *   default: '{}',
 * })
 * // declaration → { id, name? }: { id: string; name?: string } = {}
 * // call        → { id, name }
 * ```
 *
 * @example Inline (spread) — children emitted as individual top-level parameters
 * ```ts
 * createParameterGroup({
 *   properties: [createFunctionParameter({ name: 'petId', type: createParamsType({ variant: 'reference', name: 'string' }), optional: false })],
 *   inline: true,
 * })
 * // declaration → petId: string
 * // call        → petId
 * ```
 */
export function createParameterGroup(
  props: Pick<ParameterGroupNode, 'properties'> & Partial<Omit<ParameterGroupNode, 'kind' | 'properties'>>,
): ParameterGroupNode {
  return {
    ...props,
    kind: 'ParameterGroup',
  }
}

/**
 * Creates a `FunctionParametersNode` from an ordered list of parameters.
 *
 * @example
 * ```ts
 * createFunctionParameters({
 *   params: [
 *     createFunctionParameter({ name: 'petId', type: createParamsType({ variant: 'reference', name: 'string' }), optional: false }),
 *     createFunctionParameter({ name: 'config', type: createParamsType({ variant: 'reference', name: 'RequestConfig' }), optional: false, default: '{}' }),
 *   ],
 * })
 * ```
 *
 * @example
 * ```ts
 * const empty = createFunctionParameters()
 * // { kind: 'FunctionParameters', params: [] }
 * ```
 */
export function createFunctionParameters(props: Partial<Omit<FunctionParametersNode, 'kind'>> = {}): FunctionParametersNode {
  return {
    params: [],
    ...props,
    kind: 'FunctionParameters',
  }
}

/**
 * Creates an `ImportNode` representing a language-agnostic import/dependency declaration.
 *
 * @example Named import
 * ```ts
 * createImport({ name: ['useState'], path: 'react' })
 * // import { useState } from 'react'
 * ```
 *
 * @example Type-only import
 * ```ts
 * createImport({ name: ['FC'], path: 'react', isTypeOnly: true })
 * // import type { FC } from 'react'
 * ```
 */
export function createImport(props: Omit<ImportNode, 'kind'>): ImportNode {
  return { ...props, kind: 'Import' }
}

/**
 * Creates an `ExportNode` representing a language-agnostic export/public API declaration.
 *
 * @example Named export
 * ```ts
 * createExport({ name: ['Pet'], path: './Pet' })
 * // export { Pet } from './Pet'
 * ```
 *
 * @example Wildcard export
 * ```ts
 * createExport({ path: './utils' })
 * // export * from './utils'
 * ```
 */
export function createExport(props: Omit<ExportNode, 'kind'>): ExportNode {
  return { ...props, kind: 'Export' }
}

/**
 * Creates a `SourceNode` representing a fragment of source code within a file.
 *
 * @example
 * ```ts
 * createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')], isExportable: true })
 * ```
 */
export function createSource(props: Omit<SourceNode, 'kind'>): SourceNode {
  return { ...props, kind: 'Source' }
}

type UserFileNode<TMeta extends object = object> = Omit<FileNode<TMeta>, 'kind' | 'id' | 'name' | 'extname' | 'imports' | 'exports' | 'sources'> &
  Pick<Partial<FileNode<TMeta>>, 'imports' | 'exports' | 'sources'>

/**
 * Creates a fully resolved `FileNode` from a file input descriptor.
 *
 * Computes:
 * - `id` — SHA256 hash of the file path
 * - `name` — `baseName` without extension
 * - `extname` — extension extracted from `baseName`
 *
 * Deduplicates:
 * - `sources` via `combineSources`
 * - `exports` via `combineExports`
 * - `imports` via `combineImports` (also filters unused imports)
 *
 * @throws {Error} when `baseName` has no extension.
 *
 * @example
 * ```ts
 * const file = createFile({
 *   baseName: 'petStore.ts',
 *   path: 'src/models/petStore.ts',
 *   sources: [createSource({ name: 'Pet', nodes: [createText('export type Pet = { id: number }')] })],
 *   imports: [createImport({ name: ['z'], path: 'zod' })],
 *   exports: [createExport({ name: ['Pet'], path: './petStore' })],
 * })
 * // file.id      = SHA256 hash of 'src/models/petStore.ts'
 * // file.name    = 'petStore'
 * // file.extname = '.ts'
 * ```
 */
export function createFile<TMeta extends object = object>(input: UserFileNode<TMeta>): FileNode<TMeta> {
  const rawExtname = path.extname(input.baseName)
  // Handle dotfile basename like '.ts' where path.extname returns ''
  const extname = (rawExtname || (input.baseName.startsWith('.') ? input.baseName : '')) as `.${string}`
  if (!extname) {
    throw new Error(`No extname found for ${input.baseName}`)
  }

  const source = (input.sources ?? [])
    .flatMap((item) => item.nodes ?? [])
    .map((node) => extractStringsFromNodes([node]))
    .filter(Boolean)
    .join('\n\n')
  const resolvedExports = input.exports?.length ? combineExports(input.exports) : []
  const resolvedImports = input.imports?.length ? combineImports(input.imports, resolvedExports, source || undefined) : []
  const resolvedSources = input.sources?.length ? combineSources(input.sources) : []

  return {
    kind: 'File',
    ...input,
    id: createHash('sha256').update(input.path).digest('hex'),
    name: trimExtName(input.baseName),
    extname,
    imports: resolvedImports,
    exports: resolvedExports,
    sources: resolvedSources,
    meta: input.meta ?? ({} as TMeta),
  }
}

/**
 * Creates a `ConstNode` representing a TypeScript `const` declaration.
 *
 * Mirrors the `Const` component from `@kubb/renderer-jsx`.
 * The component's `children` are represented as `nodes`.
 *
 * @example Simple constant
 * ```ts
 * createConst({ name: 'pet' })
 * // const pet = ...
 * ```
 *
 * @example Exported constant with type and `as const`
 * ```ts
 * createConst({ name: 'pets', export: true, type: 'Pet[]', asConst: true })
 * // export const pets: Pet[] = ... as const
 * ```
 *
 * @example With JSDoc and child nodes
 * ```ts
 * createConst({
 *   name: 'config',
 *   export: true,
 *   JSDoc: { comments: ['@description App configuration'] },
 *   nodes: [],
 * })
 * ```
 */
export function createConst(props: Omit<ConstNode, 'kind'>): ConstNode {
  return { ...props, kind: 'Const' }
}

/**
 * Creates a `TypeNode` representing a TypeScript `type` alias declaration.
 *
 * Mirrors the `Type` component from `@kubb/renderer-jsx`.
 * The component's `children` are represented as `nodes`.
 *
 * @example Simple type alias
 * ```ts
 * createType({ name: 'Pet' })
 * // type Pet = ...
 * ```
 *
 * @example Exported type with JSDoc
 * ```ts
 * createType({
 *   name: 'PetStatus',
 *   export: true,
 *   JSDoc: { comments: ['@description Status of a pet'] },
 * })
 * // export type PetStatus = ...
 * ```
 */
export function createType(props: Omit<TypeNode, 'kind'>): TypeNode {
  return { ...props, kind: 'Type' }
}

/**
 * Creates a `FunctionNode` representing a TypeScript `function` declaration.
 *
 * Mirrors the `Function` component from `@kubb/renderer-jsx`.
 * The component's `children` are represented as `nodes`.
 *
 * @example Simple function
 * ```ts
 * createFunction({ name: 'getPet' })
 * // function getPet() { ... }
 * ```
 *
 * @example Exported async function with return type
 * ```ts
 * createFunction({ name: 'fetchPet', export: true, async: true, returnType: 'Pet' })
 * // export async function fetchPet(): Promise<Pet> { ... }
 * ```
 *
 * @example Function with generics and params
 * ```ts
 * createFunction({
 *   name: 'identity',
 *   export: true,
 *   generics: ['T'],
 *   params: 'value: T',
 *   returnType: 'T',
 * })
 * // export function identity<T>(value: T): T { ... }
 * ```
 */
export function createFunction(props: Omit<FunctionNode, 'kind'>): FunctionNode {
  return { ...props, kind: 'Function' }
}

/**
 * Creates an `ArrowFunctionNode` representing a TypeScript arrow function.
 *
 * Mirrors the `Function.Arrow` component from `@kubb/renderer-jsx`.
 * The component's `children` are represented as `nodes`.
 *
 * @example Simple arrow function
 * ```ts
 * createArrowFunction({ name: 'getPet' })
 * // const getPet = () => { ... }
 * ```
 *
 * @example Single-line exported arrow function
 * ```ts
 * createArrowFunction({ name: 'double', export: true, params: 'n: number', singleLine: true })
 * // export const double = (n: number) => ...
 * ```
 *
 * @example Async arrow function with generics
 * ```ts
 * createArrowFunction({
 *   name: 'fetchPet',
 *   export: true,
 *   async: true,
 *   generics: ['T'],
 *   params: 'id: string',
 *   returnType: 'T',
 * })
 * // export const fetchPet = async <T>(id: string): Promise<T> => { ... }
 * ```
 */
export function createArrowFunction(props: Omit<ArrowFunctionNode, 'kind'>): ArrowFunctionNode {
  return { ...props, kind: 'ArrowFunction' }
}

/**
 * Creates a {@link TextNode} representing a raw string fragment in the source output.
 *
 * Use this instead of bare strings when building `nodes` arrays so that every
 * entry in the array is a typed {@link CodeNode}.
 *
 * @example
 * ```ts
 * createText('return fetch(id)')
 * // { kind: 'Text', value: 'return fetch(id)' }
 * ```
 */
export function createText(value: string): TextNode {
  return { value, kind: 'Text' }
}

/**
 * Creates a {@link BreakNode} representing a line break in the source output.
 *
 * Corresponds to `<br/>` in JSX components. Prints as an empty string which,
 * when joined with `\n` by `printNodes`, produces a blank line.
 *
 * @example
 * ```ts
 * createBreak()
 * // { kind: 'Break' }
 * ```
 */
export function createBreak(): BreakNode {
  return { kind: 'Break' }
}

/**
 * Creates a {@link JsxNode} representing a raw JSX fragment in the source output.
 *
 * Use this to embed JSX markup (including fragments `<>…</>`) directly in generated code.
 *
 * @example
 * ```ts
 * createJsx('<>\n  <a href={href}>Open</a>\n</>')
 * // { kind: 'Jsx', value: '<>\n  <a href={href}>Open</a>\n</>' }
 * ```
 */
export function createJsx(value: string): JsxNode {
  return { value, kind: 'Jsx' }
}
