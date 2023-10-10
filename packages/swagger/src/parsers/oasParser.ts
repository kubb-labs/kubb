import pathParser from 'node:path'

import { URLPath } from '@kubb/core'

import SwaggerParser from '@apidevtools/swagger-parser'
import Oas from 'oas'
import OASNormalize from 'oas-normalize'
import swagger2openapi from 'swagger2openapi'

import { isOpenApiV3Document } from '../utils/index.ts'

import type { KubbConfig } from '@kubb/core'
import type oas from 'oas'
import type { OASDocument } from 'oas/rmoas.types'
import type { OpenAPIV2 } from 'openapi-types'

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

export async function oasPathParser(pathOrApi: string, { validate }: OasOptions = {}): Promise<oas> {
  if (validate) {
    await new OASNormalize(pathOrApi, { enablePaths: true, colorizeErrors: true }).validate()
  }

  const document = (await SwaggerParser.parse(pathOrApi)) as OASDocument

  if (!isOpenApiV3Document(document)) {
    const convertedDocument = await convertSwagger2ToOpenApi(document)
    return new Oas(convertedDocument)
  }
  return new Oas(document)
}

export async function oasParser(config: KubbConfig, options: OasOptions = {}): Promise<oas> {
  let pathOrApi = ''
  if (URLPath.isURL(config.input.path)) {
    pathOrApi = config.input.path
  } else {
    pathOrApi = pathParser.resolve(config.root, config.input.path)
  }

  return oasPathParser(pathOrApi, options)
}
