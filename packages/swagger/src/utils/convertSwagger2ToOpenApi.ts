import swagger2openapi from 'swagger2openapi'

import type { OASDocument } from 'oas/rmoas.types'
import type { OpenAPIV2 } from 'openapi-types'

export function convertSwagger2ToOpenApi(document: OASDocument): Promise<OASDocument> {
  const options = { anchors: true }
  return new Promise((resolve, reject) => {
    swagger2openapi.convertObj(document as unknown as OpenAPIV2.Document, options, (err, value) => {
      if (err) {
        reject(err)
      } else {
        resolve(value.openapi as OASDocument)
      }
    })
  })
}
