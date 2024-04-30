import OASNormalize from 'oas-normalize'
import swagger2openapi from 'swagger2openapi'

import { Oas } from '../Oas.ts'
import { filterAndSort, isOpenApiV2Document } from '../utils.ts'

import type { OASDocument } from 'oas/types'
import type { OpenAPI } from 'openapi-types'

export type FormatOptions = {
  verbose?: boolean
  'no-sort'?: boolean
  sort?: boolean
  output?: string
  sortSet?: {
    root?: Array<'openapi' | 'info' | 'servers' | 'paths' | 'components' | 'tags' | 'x-tagGroups' | 'externalDocs'>
    get?: Array<'operationId' | 'summary' | 'description' | 'parameters' | 'requestBody' | 'responses'>
    post?: Array<'operationId' | 'summary' | 'description' | 'parameters' | 'requestBody' | 'responses'>
    put?: Array<'operationId' | 'summary' | 'description' | 'parameters' | 'requestBody' | 'responses'>
    patch?: Array<'operationId' | 'summary' | 'description' | 'parameters' | 'requestBody' | 'responses'>
    delete?: Array<'operationId' | 'summary' | 'description' | 'parameters' | 'requestBody' | 'responses'>
    parameters?: Array<'name' | 'in' | 'description' | 'required' | 'schema'>
    requestBody?: Array<'description' | 'required' | 'content'>
    responses?: Array<'description' | 'headers' | 'content' | 'links'>
    content?: Array<string>
    components?: Array<'parameters' | 'schemas'>
    schema?: Array<'description' | 'type' | 'items' | 'properties' | 'format' | 'example' | 'default'>
    schemas?: Array<'description' | 'type' | 'items' | 'properties' | 'format' | 'example' | 'default'>
    properties?: Array<'description' | 'type' | 'items' | 'format' | 'example' | 'default' | 'enum'>
  }
  filterSet?: {
    methods?: Array<'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'trace' | 'head' | 'parameters'>
    inverseMethods?: Array<'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'trace' | 'head' | 'parameters'>
    tags?: Array<string>
    inverseTags?: Array<string>
    operationIds?: Array<string>
    inverseOperationIds?: Array<string>
    operations?: Array<string>
    flags?: Array<string>
    inverseFlags?: Array<string>
    flagValues?: Array<string>
    inverseFlagValues?: Array<string>
    stripFlags?: Array<string>
    responseContent?: Array<string>
    inverseResponseContent?: Array<string>
    unusedComponents?: Array<'requestBodies' | 'schemas' | 'parameters' | 'responses'>
  }
  sortComponentsSet?: {}
  casingSet?: {}
}

export async function parse(pathOrApi: string | OASDocument, options: FormatOptions = {}): Promise<Oas> {
  const oasNormalize = new OASNormalize(pathOrApi, {
    enablePaths: true,
    colorizeErrors: true,
  })
  let document: OpenAPI.Document

  try {
    // resolve external refs
    document = await oasNormalize.bundle()
  } catch (e) {
    document = (await oasNormalize.load()) as OpenAPI.Document
  }

  if (isOpenApiV2Document(document)) {
    const { openapi } = await swagger2openapi.convertObj(document, {
      anchors: true,
    })

    const oas = await filterAndSort(openapi as OASDocument, options)

    return new Oas({ oas: oas as OASDocument })
  }

  const oas = await filterAndSort(document as OASDocument, options)

  return new Oas({ oas })
}
