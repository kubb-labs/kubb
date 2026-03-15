import path from 'node:path'
import { URLPath, pascalCase } from '@internals/utils'
import type { Config } from '@kubb/core'
import { bundle, loadConfig } from '@redocly/openapi-core'
import yaml from '@stoplight/yaml'
import { isRef } from 'oas/types'
import OASNormalize from 'oas-normalize'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { isPlainObject, mergeDeep } from 'remeda'
import swagger2openapi from 'swagger2openapi'
import { STRUCTURAL_KEYS } from './constants.ts'
import { Oas } from './Oas.ts'
import type { Document, SchemaObject } from './types.ts'
import type { contentType } from './types.ts'

/**
 * Returns `true` when `doc` looks like a Swagger 2.0 document (no `openapi` key).
 */
export function isOpenApiV2Document(doc: unknown): doc is OpenAPIV2.Document {
  return !!doc && isPlainObject(doc) && !('openapi' in doc)
}

/**
 * Returns `true` when `doc` looks like an OpenAPI 3.x document (has `openapi` key).
 */
export function isOpenApiV3Document(doc: unknown): doc is OpenAPIV3.Document {
  return !!doc && isPlainObject(doc) && 'openapi' in doc
}

/**
 * Returns `true` when `doc` is an OpenAPI 3.1 document.
 */
export function isOpenApiV3_1Document(doc: unknown): doc is OpenAPIV3_1.Document {
  return !!doc && isPlainObject(doc) && 'openapi' in (doc as object) && (doc as { openapi: string }).openapi.startsWith('3.1')
}

/**
 * Determines if a schema is nullable, considering:
 * - OpenAPI 3.0 `nullable` / `x-nullable`
 * - OpenAPI 3.1 JSON Schema `type: ['null', ...]` or `type: 'null'`
 */
export function isNullable(schema?: SchemaObject & { 'x-nullable'?: boolean }): boolean {
  const explicitNullable = schema?.nullable ?? schema?.['x-nullable']
  if (explicitNullable === true) {
    return true
  }

  const schemaType = schema?.type
  if (schemaType === 'null') {
    return true
  }
  if (Array.isArray(schemaType)) {
    return schemaType.includes('null')
  }

  return false
}

/**
 * Returns `true` when `obj` is an OpenAPI `$ref` pointer object.
 */
export function isReference(obj?: unknown): obj is OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject {
  return !!obj && isRef(obj as object)
}

/**
 * Returns `true` when `obj` is a schema that carries a structured `discriminator` object
 * (as opposed to a plain string discriminator used in some older specs).
 */
export function isDiscriminator(obj?: unknown): obj is SchemaObject & { discriminator: OpenAPIV3.DiscriminatorObject } {
  const record = obj as Record<string, unknown>
  return !!obj && !!record['discriminator'] && typeof record['discriminator'] !== 'string'
}

export async function parse(
  pathOrApi: string | Document,
  { oasClass = Oas, canBundle = true, enablePaths = true }: { oasClass?: typeof Oas; canBundle?: boolean; enablePaths?: boolean } = {},
): Promise<Oas> {
  if (typeof pathOrApi === 'string' && canBundle) {
    // resolve external refs
    const config = await loadConfig()
    const bundleResults = await bundle({ ref: pathOrApi, config, base: pathOrApi })

    return parse(bundleResults.bundle.parsed as string, { oasClass, canBundle, enablePaths })
  }

  const oasNormalize = new OASNormalize(pathOrApi, {
    enablePaths,
    colorizeErrors: true,
  })
  const document = (await oasNormalize.load()) as Document

  if (isOpenApiV2Document(document)) {
    const { openapi } = await swagger2openapi.convertObj(document, {
      anchors: true,
    })

    return new oasClass(openapi as Document)
  }

  return new oasClass(document)
}

export async function merge(pathOrApi: Array<string | Document>, { oasClass = Oas }: { oasClass?: typeof Oas } = {}): Promise<Oas> {
  const instances = await Promise.all(pathOrApi.map((p) => parse(p, { oasClass, enablePaths: false, canBundle: false })))

  if (instances.length === 0) {
    throw new Error('No OAS instances provided for merging.')
  }

  const merged = instances.reduce(
    (acc, current) => {
      return mergeDeep(acc, current.document as Document)
    },
    {
      openapi: '3.0.0',
      info: {
        title: 'Merged API',
        version: '1.0.0',
      },
      paths: {},
      components: {
        schemas: {},
      },
    } as any,
  )

  return parse(merged, { oasClass })
}

export function parseFromConfig(config: Config, oasClass: typeof Oas = Oas): Promise<Oas> {
  if ('data' in config.input) {
    if (typeof config.input.data === 'object') {
      const api: Document = structuredClone(config.input.data) as Document
      return parse(api, { oasClass })
    }

    // data is a string - try YAML first, then fall back to passing to parse()
    try {
      const api: string = yaml.parse(config.input.data as string)
      return parse(api, { oasClass })
    } catch (_e) {
      // YAML parse failed, let parse() handle it (supports JSON strings and more)
      return parse(config.input.data as string, { oasClass })
    }
  }

  if (Array.isArray(config.input)) {
    return merge(
      config.input.map((input) => path.resolve(config.root, input.path)),
      { oasClass },
    )
  }

  if (new URLPath(config.input.path).isURL) {
    return parse(config.input.path, { oasClass })
  }

  return parse(path.resolve(config.root, config.input.path), { oasClass })
}

/**
 * Flatten allOf schemas by merging keyword-only fragments.
 * Only flattens schemas where allOf items don't contain structural keys or $refs.
 */
export function flattenSchema(schema: SchemaObject | null): SchemaObject | null {
  if (!schema?.allOf || schema.allOf.length === 0) {
    return schema || null
  }

  // Never touch ref-based or structural composition
  if (schema.allOf.some((item) => isRef(item))) {
    return schema
  }

  const isPlainFragment = (item: SchemaObject) => !Object.keys(item).some((key) => STRUCTURAL_KEYS.has(key))

  // Only flatten keyword-only fragments
  if (!schema.allOf.every((item) => isPlainFragment(item as SchemaObject))) {
    return schema
  }

  const merged: SchemaObject = { ...schema }
  delete merged.allOf

  for (const fragment of schema.allOf as SchemaObject[]) {
    for (const [key, value] of Object.entries(fragment)) {
      if (merged[key as keyof typeof merged] === undefined) {
        merged[key as keyof typeof merged] = value
      }
    }
  }

  return merged
}

export async function validate(document: Document) {
  const oasNormalize = new OASNormalize(document, {
    enablePaths: true,
    colorizeErrors: true,
  })

  return oasNormalize.validate({
    parser: {
      validate: {
        errors: {
          colorize: true,
        },
      },
    },
  })
}

type SchemaSourceMode = 'schemas' | 'responses' | 'requestBodies'

export type SchemaWithMetadata = {
  schema: SchemaObject
  source: SchemaSourceMode
  originalName: string
}

type GetSchemasResult = {
  schemas: Record<string, SchemaObject>
  nameMapping: Map<string, string>
}

export function collectRefs(schema: unknown, refs = new Set<string>()): Set<string> {
  if (Array.isArray(schema)) {
    for (const item of schema) {
      collectRefs(item, refs)
    }
    return refs
  }

  if (schema && typeof schema === 'object') {
    for (const [key, value] of Object.entries(schema)) {
      if (key === '$ref' && typeof value === 'string') {
        const match = value.match(/^#\/components\/schemas\/(.+)$/)
        if (match) {
          refs.add(match[1]!)
        }
      } else {
        collectRefs(value, refs)
      }
    }
  }

  return refs
}

export function sortSchemas(schemas: Record<string, SchemaObject>): Record<string, SchemaObject> {
  const deps = new Map<string, string[]>()

  for (const [name, schema] of Object.entries(schemas)) {
    deps.set(name, Array.from(collectRefs(schema)))
  }

  const sorted: string[] = []
  const visited = new Set<string>()

  function visit(name: string, stack = new Set<string>()) {
    if (visited.has(name)) {
      return
    }
    if (stack.has(name)) {
      return
    }
    stack.add(name)
    const children = deps.get(name) || []
    for (const child of children) {
      if (deps.has(child)) {
        visit(child, stack)
      }
    }
    stack.delete(name)
    visited.add(name)
    sorted.push(name)
  }

  for (const name of Object.keys(schemas)) {
    visit(name)
  }

  const sortedSchemas: Record<string, SchemaObject> = {}
  for (const name of sorted) {
    sortedSchemas[name] = schemas[name]!
  }
  return sortedSchemas
}

export function extractSchemaFromContent(content: Record<string, unknown> | undefined, preferredContentType?: contentType): SchemaObject | null {
  if (!content) {
    return null
  }
  const firstContentType = Object.keys(content)[0] || 'application/json'
  const targetContentType = preferredContentType || firstContentType
  const contentSchema = content[targetContentType] as { schema?: SchemaObject } | undefined
  const schema = contentSchema?.schema

  if (schema && '$ref' in schema) {
    return null
  }

  return schema || null
}

function getSemanticSuffix(source: SchemaSourceMode): string {
  switch (source) {
    case 'schemas':
      return 'Schema'
    case 'responses':
      return 'Response'
    case 'requestBodies':
      return 'Request'
  }
}

export function legacyResolve(schemasWithMeta: SchemaWithMetadata[]): GetSchemasResult {
  const schemas: Record<string, SchemaObject> = {}
  const nameMapping = new Map<string, string>()

  for (const item of schemasWithMeta) {
    schemas[item.originalName] = item.schema
    const refPath = `#/components/${item.source}/${item.originalName}`
    nameMapping.set(refPath, item.originalName)
  }

  return { schemas, nameMapping }
}

export function resolveCollisions(schemasWithMeta: SchemaWithMetadata[]): GetSchemasResult {
  const schemas: Record<string, SchemaObject> = {}
  const nameMapping = new Map<string, string>()
  const normalizedNames = new Map<string, SchemaWithMetadata[]>()

  for (const item of schemasWithMeta) {
    const normalized = pascalCase(item.originalName)
    if (!normalizedNames.has(normalized)) {
      normalizedNames.set(normalized, [])
    }
    normalizedNames.get(normalized)!.push(item)
  }

  for (const [, items] of normalizedNames) {
    if (items.length === 1) {
      const item = items[0]!
      schemas[item.originalName] = item.schema
      const refPath = `#/components/${item.source}/${item.originalName}`
      nameMapping.set(refPath, item.originalName)
      continue
    }

    const sources = new Set(items.map((item) => item.source))

    if (sources.size === 1) {
      items.forEach((item, index) => {
        const suffix = index === 0 ? '' : (index + 1).toString()
        const uniqueName = item.originalName + suffix
        schemas[uniqueName] = item.schema
        const refPath = `#/components/${item.source}/${item.originalName}`
        nameMapping.set(refPath, uniqueName)
      })
    } else {
      items.forEach((item) => {
        const suffix = getSemanticSuffix(item.source)
        const uniqueName = item.originalName + suffix
        schemas[uniqueName] = item.schema
        const refPath = `#/components/${item.source}/${item.originalName}`
        nameMapping.set(refPath, uniqueName)
      })
    }
  }

  return { schemas, nameMapping }
}
