import { isRef, isSchema } from 'oas/types'
import { isPlainObject } from 'remeda'

import { bundle, loadConfig } from '@redocly/openapi-core'
import OASNormalize from 'oas-normalize'
import type { OASDocument } from 'oas/types'
import type { ParameterObject, SchemaObject } from 'oas/types'
import type { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
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

export function isReference(obj?: unknown): obj is OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject {
  return !!obj && isRef(obj)
}

export function isRequired(schema?: SchemaObject): boolean {
  if (!schema) {
    return false
  }

  return Array.isArray(schema.required) ? !!schema.required?.length : !!schema.required
}

export function isOptional(schema?: SchemaObject): boolean {
  return !isRequired(schema)
}

export async function parse(pathOrApi: string | OASDocument, oasClass: typeof Oas = Oas): Promise<Oas> {
  if (typeof pathOrApi === 'string') {
    // resolve external refs
    const config = await loadConfig()
    const bundleResults = await bundle({ ref: pathOrApi, config, base: pathOrApi })

    return parse(bundleResults.bundle.parsed)
  }

  const oasNormalize = new OASNormalize(pathOrApi, {
    enablePaths: true,
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
