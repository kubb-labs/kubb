import path from 'node:path'
import { URLPath } from '@internals/utils'
import type { Config } from '@kubb/core'
import { bundle } from '@scalar/json-magic/bundle'
import { fetchUrls } from '@scalar/json-magic/bundle/plugins/browser'
import { parseJson, parseYaml, readFiles } from '@scalar/json-magic/bundle/plugins/node'
import { validate as scalarValidate, upgrade } from '@scalar/openapi-parser'
import type { OASDocument } from 'oas/types'
import { mergeDeep } from 'remeda'

import { isOpenApiV2Document } from './utils.ts'

type OasConstructor<T> = new (document: OASDocument) => T & { document: OASDocument }

export async function parse<T>(
  pathOrApi: string | OASDocument,
  { oasClass, canBundle: _canBundle = true, enablePaths: _enablePaths = true }: { oasClass: OasConstructor<T>; canBundle?: boolean; enablePaths?: boolean },
): Promise<T> {
  let document: OASDocument

  if (typeof pathOrApi === 'string') {
    const data = await bundle(pathOrApi, {
      plugins: [readFiles(), fetchUrls(), parseYaml(), parseJson()],
      treeShake: true,
      urlMap: true,
    })
    document = data as OASDocument
  } else {
    document = pathOrApi
  }

  if (isOpenApiV2Document(document)) {
    const { specification } = upgrade(document)
    return parse(specification as unknown as string, { oasClass })
  }

  return new oasClass(document)
}

export async function merge<T>(pathOrApi: Array<string | OASDocument>, { oasClass }: { oasClass: OasConstructor<T> }): Promise<T> {
  const instances = await Promise.all(pathOrApi.map((p) => parse(p, { oasClass })))

  if (instances.length === 0) {
    throw new Error('No OAS instances provided for merging.')
  }

  const merged = instances.reduce(
    (acc, current) => {
      return mergeDeep(acc, (current as { document: OASDocument }).document)
    },
    {
      openapi: '3.0.0',
      info: {
        title: 'Merged API',
        version: '1.0.0',
      },
      paths: {},
      components: {
        schemas: {},
      },
    } as any,
  )

  return parse(merged, { oasClass })
}

export function parseFromConfig<T>(config: Config, oasClass: OasConstructor<T>): Promise<T> {
  if ('data' in config.input) {
    if (typeof config.input.data === 'object') {
      const api: OASDocument = structuredClone(config.input.data) as OASDocument
      return parse(api, { oasClass })
    }

    // data is a string (YAML or JSON) — plugins handle both formats
    return parse(config.input.data as string, { oasClass })
  }

  if (Array.isArray(config.input)) {
    return merge(
      config.input.map((input) => path.resolve(config.root, input.path)),
      { oasClass },
    )
  }

  if (new URLPath(config.input.path).isURL) {
    return parse(config.input.path, { oasClass })
  }

  return parse(path.resolve(config.root, config.input.path), { oasClass })
}

/**
 * Validate an OpenAPI document using @scalar/openapi-parser.
 */
export async function validate(document: OASDocument) {
  const { valid, errors } = await scalarValidate(document)
  if (!valid) {
    throw new Error(errors?.map((e) => e.message).join('\n'))
  }
  return { valid, errors }
}
