import OASNormalize from 'oas-normalize'
import swagger2openapi from 'swagger2openapi'

import { Oas } from '../Oas.ts'
import { isOpenApiV2Document } from '../utils.ts'

import type { OASDocument } from 'oas/types'
import type { OpenAPI } from 'openapi-types'

export async function parse(pathOrApi: string | OASDocument): Promise<Oas> {
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
    const { openapi: oas } = await swagger2openapi.convertObj(document, { anchors: true })

    return new Oas({ oas: oas as OASDocument })
  }

  return new Oas({ oas: document })
}
