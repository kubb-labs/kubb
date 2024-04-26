import OASNormalize from 'oas-normalize'
import swagger2openapi from 'swagger2openapi'

import { Oas } from '../Oas.ts'
import { filterAndSort, isOpenApiV2Document } from '../utils.ts'

import type { OASDocument } from 'oas/types'
import type openapiFormat from 'openapi-format'
import type { OpenAPI } from 'openapi-types'

export async function parse(pathOrApi: string | OASDocument, options: openapiFormat.Options = {}): Promise<Oas> {
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
    const { openapi } = await swagger2openapi.convertObj(document, { anchors: true })

    const oas = await filterAndSort(openapi as OASDocument, options)

    return new Oas({ oas: oas as OASDocument })
  }

  const oas = await filterAndSort(document as OASDocument, options)

  return new Oas({ oas })
}
