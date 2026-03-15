import path from 'node:path'
import { createRoot } from '@kubb/ast'
import type { AdapterSource } from '@kubb/core'
import { defineAdapter } from '@kubb/core'
import { logAst } from './devtools.ts'
import { resolveServerUrl } from './oas/resolveServerUrl.ts'
import { parseFromConfig } from './oas/utils.ts'
import { createOasParser } from './parser.ts'
import type { OasAdapter } from './types.ts'

export const adapterOasName = 'oas' satisfies OasAdapter['name']

/**
 * Creates an OpenAPI / Swagger adapter for Kubb.
 *
 * This is the default adapter — you can omit it from your config when using
 * an OpenAPI spec, but supplying it explicitly lets you pass options.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@kubb/core'
 * import { adapterOas } from '@kubb/adapter-oas'
 *
 * export default defineConfig({
 *   adapter: adapterOas({ validate: true, dateType: 'date' }),
 *   input:   { path: './openapi.yaml' },
 *   plugins: [pluginTs(), pluginZod()],
 * })
 * ```
 */
export const adapterOas = defineAdapter<OasAdapter>((options) => {
  const {
    validate = true,
    oasClass,
    contentType,
    serverIndex,
    serverVariables,
    discriminator = 'strict',
    collisionDetection = false,
    dateType = 'string',
    integerType = 'number',
    unknownType = 'any',
    emptySchemaType = unknownType,
    devtools,
  } = options

  return {
    name: adapterOasName,
    options: {
      validate,
      oasClass,
      contentType,
      serverIndex,
      serverVariables,
      discriminator,
      collisionDetection,
      dateType,
      integerType,
      unknownType,
      emptySchemaType,
      devtools,
    },
    async parse(source) {
      const fakeConfig = sourceToFakeConfig(source)
      const oas = await parseFromConfig(fakeConfig, oasClass)

      oas.setOptions({ contentType, discriminator, collisionDetection })

      if (validate) {
        try {
          await oas.validate()
        } catch (_err) {
          // Validation failures are non-fatal — mirror plugin-oas behaviour
        }
      }

      const server = serverIndex !== undefined ? oas.api.servers?.at(serverIndex) : undefined
      const baseURL = server?.url ? resolveServerUrl(server, serverVariables) : undefined

      const parser = createOasParser(oas, { contentType, collisionDetection })
      const root = parser.buildAst({ dateType, integerType, unknownType, emptySchemaType, enumSuffix: 'enum' })

      const rootNode = createRoot({
        ...root,
        meta: {
          title: oas.api.info?.title,
          version: oas.api.info?.version,
          baseURL,
        },
      })

      if (devtools) {
        const devtoolsOptions = devtools === true ? {} : devtools

        logAst(rootNode, devtoolsOptions)
      }

      return rootNode
    },
  }
})

/**
 * Maps an `AdapterSource` back to the minimal Config shape that
 * `parseFromConfig` expects.
 * @deprecated make parseFromConfig to use AdapterSource
 */
function sourceToFakeConfig(source: AdapterSource): Parameters<typeof parseFromConfig>[0] {
  switch (source.type) {
    case 'path':
      return { root: path.dirname(source.path), input: { path: source.path } } as Parameters<typeof parseFromConfig>[0]
    case 'data':
      return { root: process.cwd(), input: { data: source.data } } as Parameters<typeof parseFromConfig>[0]
    case 'paths':
      return {
        root: source.paths[0] ? path.dirname(source.paths[0]) : process.cwd(),
        input: source.paths.map((p) => ({ path: p })),
      } as Parameters<typeof parseFromConfig>[0]
  }
}
