import path from 'node:path'
import { createRoot } from '@kubb/ast'
import type { AdapterSource } from '@kubb/core'
import { createAdapter } from '@kubb/core'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { resolveServerUrl } from './oas/resolveServerUrl.ts'
import { parseFromConfig } from './oas/utils.ts'
import { createOasParser } from './parser.ts'
import type { OasAdapter } from './types.ts'
import { getImports } from './utils.ts'

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
export const adapterOas = createAdapter<OasAdapter>((options) => {
  const {
    validate = true,
    oasClass,
    contentType,
    serverIndex,
    serverVariables,
    discriminator = 'strict',
    legacy = false,
    dateType = DEFAULT_PARSER_OPTIONS.dateType,
    integerType = DEFAULT_PARSER_OPTIONS.integerType,
    unknownType = DEFAULT_PARSER_OPTIONS.unknownType,
    enumSuffix = DEFAULT_PARSER_OPTIONS.enumSuffix,
    emptySchemaType = unknownType || DEFAULT_PARSER_OPTIONS.emptySchemaType,
  } = options

  // legacy: true  → old v4 naming (no collision resolution, shorter enum names)
  // legacy: false → v5 default (full collision resolution, full-path enum names)
  const collisionDetection = !legacy

  // Mutable Map shared between `options` and each `parse()` call.
  // Populated (and replaced) on every parse so consumers always see the latest state.
  const nameMapping = new Map<string, string>()

  return {
    name: adapterOasName,
    options: {
      validate,
      oasClass,
      contentType,
      serverIndex,
      serverVariables,
      discriminator,
      legacy,
      dateType,
      integerType,
      unknownType,
      emptySchemaType,
      enumSuffix,
      nameMapping,
    },
    getImports(node, resolve) {
      return getImports({ node, nameMapping, resolve })
    },
    async parse(source) {
      const fakeConfig = sourceToFakeConfig(source)
      const oas = await parseFromConfig(fakeConfig, oasClass)

      oas.setOptions({ contentType, discriminator, collisionDetection })

      if (validate) {
        try {
          await oas.validate()
        } catch (_err) {
          // Validation failures are non-fatal — mirror plugin-oas behavior
        }
      }

      const server = serverIndex !== undefined ? oas.api.servers?.at(serverIndex) : undefined
      const baseURL = server?.url ? resolveServerUrl(server, serverVariables) : undefined

      const parser = createOasParser(oas, { contentType, collisionDetection })

      // Sync the adapter's shared nameMapping with the one computed by the parser.
      nameMapping.clear()
      for (const [key, value] of parser.nameMapping) {
        nameMapping.set(key, value)
      }

      const root = parser.parse({ dateType, integerType, unknownType, emptySchemaType, enumSuffix })

      return createRoot({
        ...root,
        meta: {
          title: oas.api.info?.title,
          description: oas.api.info?.description,
          version: oas.api.info?.version,
          baseURL,
        },
      })
    },
  }
})

// TODO: remove once parseFromConfig accepts AdapterSource directly
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
