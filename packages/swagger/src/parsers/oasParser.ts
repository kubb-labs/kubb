import pathParser from 'path'

import SwaggerParser from '@apidevtools/swagger-parser'

import type { KubbConfig } from '@kubb/core'

import { isOpenApiV3Document } from '../utils'

import type OasType from 'oas'
import type { OASDocument } from 'oas/dist/rmoas.types'

// TODO should be import Oas from "oas";
const Oas: typeof OasType = require('oas').default

type Options = {
  validate?: boolean
}
export const oasPathParser = async (path: string, { validate }: Options = {}) => {
  if (validate) {
    await SwaggerParser.validate(path)
  }

  const api = (await SwaggerParser.parse(path)) as OASDocument

  if (!isOpenApiV3Document(api)) {
    throw new Error('OpenAPI Document version not supported')
  }
  return new Oas(api)
}

export const oasParser = async (config: KubbConfig, options: Options = {}) => {
  let path = ''
  if (typeof config.input === 'string') {
    path = JSON.parse(config.input)
  } else {
    path = pathParser.resolve(config.root, config.input.path)
  }

  return oasPathParser(path, options)
}
