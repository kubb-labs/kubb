import OASNormalize from 'oas-normalize'
import swagger2openapi from 'swagger2openapi'

import type { OpenAPIV2 } from 'openapi-types'
import { Oas } from '../Oas.ts'
import type { OasTypes } from '../types.ts'
import { isOpenApiV2Document } from '../utils.ts'

export async function parse(pathOrApi: string | OasTypes.OASDocument): Promise<Oas> {
  const oasNormalize = new OASNormalize(pathOrApi, {
    enablePaths: true,
    colorizeErrors: true,
  })

  const document = (await oasNormalize.load()) as unknown as OpenAPIV2.Document

  if (isOpenApiV2Document(document)) {
    const { openapi: oas } = await swagger2openapi.convertObj(document, { anchors: true })

    return new Oas({ oas: oas as OasTypes.OASDocument })
  }

  return new Oas({ oas: document })
}
