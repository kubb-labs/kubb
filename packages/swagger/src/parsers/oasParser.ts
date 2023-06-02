import pathParser from 'node:path'

import SwaggerParser from '@apidevtools/swagger-parser'
import swagger2openapi from 'swagger2openapi'
import oasNormalize from 'oas-normalize'
import oas from 'oas'

import type { KubbConfig } from '@kubb/core'
import { isURL } from '@kubb/core'

import { isOpenApiV3Document } from '../utils/index.ts'

import type { OpenAPIV2 } from 'openapi-types'
import type { OASDocument } from 'oas/dist/rmoas.types.ts'

const Oas = oas as unknown as typeof oas.default
const OASNormalize = oasNormalize.default

export type OasOptions = {
  validate?: boolean
}

function convertSwagger2ToOpenApi(document: OASDocument): Promise<OASDocument> {
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

export async function oasPathParser(pathOrApi: string, { validate }: OasOptions = {}) {
  if (validate) {
    const oas = new OASNormalize(pathOrApi, { enablePaths: true, colorizeErrors: true })

    try {
      await oas.validate()
    } catch (e) {
      console.log('\n', (e as Error).message)
    }
  }

  const document = (await SwaggerParser.parse(pathOrApi)) as OASDocument

  if (!isOpenApiV3Document(document)) {
    const convertedDocument = await convertSwagger2ToOpenApi(document)
    return new Oas(convertedDocument)
  }
  return new Oas(document)
}

export async function oasParser(config: KubbConfig, options: OasOptions = {}) {
  let pathOrApi = ''
  if (isURL(config.input.path)) {
    pathOrApi = config.input.path
  } else {
    pathOrApi = pathParser.resolve(config.root, config.input.path)
  }

  return oasPathParser(pathOrApi, options)
}
