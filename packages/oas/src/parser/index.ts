import { bundle, loadConfig } from '@redocly/openapi-core'
import OASNormalize from 'oas-normalize'
import swagger2openapi from 'swagger2openapi'

import { Oas } from '../Oas.ts'
import { isOpenApiV2Document } from '../utils.ts'

import type { OASDocument } from 'oas/types'
import type { OpenAPI } from 'openapi-types'

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

  return new oasClass({ oas: document as OASDocument })
}
