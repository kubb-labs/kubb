import { resolve } from 'node:path'

import { URLPath } from '@kubb/core/utils'

import SwaggerParser from '@apidevtools/swagger-parser'
import yaml from 'js-yaml'
import Oas from 'oas'
import OASNormalize from 'oas-normalize'

import { convertSwagger2ToOpenApi } from './utils/convertSwagger2ToOpenApi.ts'
import { isOpenApiV3Document } from './utils/isOpenApiV3Document.ts'

import type { KubbConfig } from '@kubb/core'
import type oas from 'oas'
import type { OASDocument } from 'oas/rmoas.types'

type Options = {
  validate?: boolean
}

export class OasManager {
  #options: Options = {}
  #oas?: Oas

  constructor(options: Options = {}) {
    this.#options = options

    return this
  }

  get oas(): Oas | undefined {
    return this.#oas
  }

  async parse(pathOrApi: string | OASDocument): Promise<oas> {
    const { validate } = this.#options

    if (validate) {
      await new OASNormalize(pathOrApi, { enablePaths: true, colorizeErrors: true }).validate()
    }

    const document = (await SwaggerParser.parse(pathOrApi)) as OASDocument

    if (!isOpenApiV3Document(document)) {
      const convertedDocument = await convertSwagger2ToOpenApi(document)
      this.#oas = new Oas(convertedDocument)
      return this.#oas
    }
    this.#oas = new Oas(document)

    return this.#oas
  }

  static parseFromConfig(config: KubbConfig, options: Options = {}): Promise<oas> {
    if ('data' in config.input) {
      if (typeof config.input.data === 'object') {
        const api: OASDocument = JSON.parse(JSON.stringify(config.input.data)) as OASDocument
        return new OasManager(options).parse(api)
      }

      try {
        const api: string = yaml.load(config.input.data as string) as string

        return new OasManager(options).parse(api)
      } catch (e) {
        /* empty */
      }

      const api: OASDocument = JSON.parse(JSON.stringify(config.input.data)) as OASDocument

      return new OasManager(options).parse(api)
    }

    if (new URLPath(config.input.path).isURL) {
      return new OasManager(options).parse(config.input.path)
    }

    return new OasManager(options).parse(resolve(config.root, config.input.path))
  }
}
