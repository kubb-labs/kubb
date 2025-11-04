import path from 'node:path'
import type { Config } from '@kubb/core'
import { URLPath } from '@kubb/core/utils'
import yaml from '@stoplight/yaml'
import type * as OasTypes from 'oas/types'
import type { OASDocument, ParameterObject, SchemaObject } from 'oas/types'
import { isRef, isSchema } from 'oas/types'
import OASNormalize from 'oas-normalize'
import type { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { isPlainObject, mergeDeep } from 'remeda'
import swagger2openapi from 'swagger2openapi'
import { Oas } from './Oas.ts'

export function isOpenApiV2Document(doc: any): doc is OpenAPIV2.Document {
  return doc && isPlainObject(doc) && !('openapi' in doc)
}
export function isOpenApiV3Document(doc: any): doc is OpenAPIV3.Document {
  return doc && isPlainObject(doc) && 'openapi' in doc
}

export function isOpenApiV3_1Document(doc: any): doc is OpenAPIV3_1.Document {
  return doc && isPlainObject<OpenAPIV3_1.Document>(doc) && 'openapi' in doc && doc.openapi.startsWith('3.1')
}

export function isJSONSchema(obj?: unknown): obj is SchemaObject {
  return !!obj && isSchema(obj)
}

export function isParameterObject(obj: ParameterObject | SchemaObject): obj is ParameterObject {
  return obj && 'in' in obj
}

/**
 * Determines if a schema is nullable, considering both the standard `nullable` property and the legacy `x-nullable` extension.
 *
 * @param schema - The schema object to check.
 * @returns `true` if the schema is marked as nullable; otherwise, `false`.
 */
export function isNullable(schema?: SchemaObject & { 'x-nullable'?: boolean }): boolean {
  return schema?.nullable ?? schema?.['x-nullable'] ?? false
}

/**
 * Determines if the given object is an OpenAPI ReferenceObject.
 *
 * @returns True if {@link obj} is a ReferenceObject; otherwise, false.
 */
export function isReference(obj?: any): obj is OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject {
  return !!obj && isRef(obj)
}

/**
 * Determines if the given object is a SchemaObject with a discriminator property of type DiscriminatorObject.
 *
 * @returns True if {@link obj} is a SchemaObject containing a non-string {@link discriminator} property.
 */
export function isDiscriminator(obj?: any): obj is SchemaObject & { discriminator: OpenAPIV3.DiscriminatorObject } {
  return !!obj && obj?.['discriminator'] && typeof obj.discriminator !== 'string'
}

/**
 * Determines whether a schema is required.
 *
 * Returns true if the schema has a non-empty {@link SchemaObject.required} array or a truthy {@link SchemaObject.required} property.
 *
 * @param schema - The schema object to check.
 * @returns True if the schema is required; otherwise, false.
 */
export function isRequired(schema?: SchemaObject): boolean {
  if (!schema) {
    return false
  }

  return Array.isArray(schema.required) ? !!schema.required?.length : !!schema.required
}

export function isOptional(schema?: SchemaObject): boolean {
  return !isRequired(schema)
}

export async function parse(
  pathOrApi: string | OASDocument,
  { oasClass = Oas, canBundle = true, enablePaths = true }: { oasClass?: typeof Oas; canBundle?: boolean; enablePaths?: boolean } = {},
): Promise<Oas> {
  const { loadConfig, bundle } = await import('@redocly/openapi-core')

  if (typeof pathOrApi === 'string' && canBundle) {
    // resolve external refs
    const config = await loadConfig()
    const bundleResults = await bundle({ ref: pathOrApi, config, base: pathOrApi })

    return parse(bundleResults.bundle.parsed as string)
  }

  const oasNormalize = new OASNormalize(pathOrApi, {
    enablePaths,
    colorizeErrors: true,
  })
  const document = (await oasNormalize.load()) as OpenAPI.Document

  if (isOpenApiV2Document(document)) {
    const { openapi } = await swagger2openapi.convertObj(document, {
      anchors: true,
    })

    return new oasClass({ oas: openapi as OASDocument })
  }

  return new oasClass({ oas: document })
}

export async function merge(pathOrApi: Array<string | OASDocument>, { oasClass = Oas }: { oasClass?: typeof Oas } = {}): Promise<Oas> {
  const instances = await Promise.all(pathOrApi.map((p) => parse(p, { oasClass, enablePaths: false, canBundle: false })))

  if (instances.length === 0) {
    throw new Error('No OAS instances provided for merging.')
  }

  const merged = instances.reduce(
    (acc, current) => {
      return mergeDeep(acc, current.document as OASDocument)
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
      const api: OasTypes.OASDocument = JSON.parse(JSON.stringify(config.input.data)) as OasTypes.OASDocument
      return parse(api, { oasClass })
    }

    try {
      const api: string = yaml.parse(config.input.data as string) as string

      return parse(api, { oasClass })
    } catch (_e) {
      /* empty */
    }

    const api: OasTypes.OASDocument = JSON.parse(JSON.stringify(config.input.data)) as OasTypes.OASDocument

    return parse(api, { oasClass })
  }

  if (Array.isArray(config.input)) {
    return merge(
      config.input.map((input) => input.path),
      { oasClass },
    )
  }

  if (new URLPath(config.input.path).isURL) {
    return parse(config.input.path, { oasClass })
  }

  return parse(path.resolve(config.root, config.input.path), { oasClass })
}
