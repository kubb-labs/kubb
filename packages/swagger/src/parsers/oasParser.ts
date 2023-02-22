import pathParser from 'path'
import { URL } from 'url'

import SwaggerParser from '@apidevtools/swagger-parser'
import swagger2openapi from 'swagger2openapi'

import type { KubbConfig } from '@kubb/core'

import { isOpenApiV3Document } from '../utils'

import type OasType from 'oas'
import type { OASDocument } from 'oas/dist/rmoas.types'

// TODO should be import Oas from "oas";
const Oas: typeof OasType = require('oas').default

type Options = {
  validate?: boolean
}

const convertSwagger2ToOpenApi = (document: OASDocument): Promise<OASDocument> => {
  const options = { anchors: true }
  return new Promise((resolve, reject) => {
    swagger2openapi.convertObj(document, options, (err, value) => {
      if (err) {
        reject(err)
      } else {
        resolve(value.openapi)
      }
    })
  })
}

export const oasPathParser = async (pathOrApi: string, { validate }: Options = {}) => {
  if (validate) {
    await SwaggerParser.validate(pathOrApi)
  }

  const document = (await SwaggerParser.parse(pathOrApi)) as OASDocument

  if (!isOpenApiV3Document(document)) {
    const convertedDocument = await convertSwagger2ToOpenApi(document)
    return new Oas(convertedDocument)
  }
  return new Oas(document)
}

export const oasParser = async (config: KubbConfig, options: Options = {}) => {
  let pathOrApi = ''
  if (typeof config.input === 'string') {
    pathOrApi = JSON.parse(config.input)
  } else {
    try {
      const url = new URL(config.input.path)
      if (url) {
        pathOrApi = config.input.path
      }
    } catch (error) {
      pathOrApi = pathParser.resolve(config.root, config.input.path)
    }
  }

  return oasPathParser(pathOrApi, options)
}
