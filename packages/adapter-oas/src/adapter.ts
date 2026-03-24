import path from 'node:path'
import { collectImports, createRoot } from '@kubb/ast'
import type { AdapterSource } from '@kubb/core'
import { createAdapter } from '@kubb/core'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { resolveServerUrl } from './oas/resolveServerUrl.ts'
import { parseFromConfig } from './oas/utils.ts'
import { createOasParser } from './parser.ts'
import type { OasAdapter } from './types.ts'

/**
 * Stable string identifier for the OAS adapter used in Kubb's adapter registry.
 */
export const adapterOasName = 'oas' satisfies OasAdapter['name']

/**
 * Creates the default OpenAPI / Swagger adapter for Kubb.
 *
 * Parses the spec, optionally validates it, resolves the base URL, and converts
 * everything into a `RootNode` that downstream plugins consume.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@kubb/core'
 * import { adapterOas } from '@kubb/adapter-oas'
 * import { pluginTs } from '@kubb/plugin-ts'
 *
 * export default defineConfig({
 *   adapter: adapterOas({ dateType: 'date', serverIndex: 0 }),
 *   input: { path: './openapi.yaml' },
 *   plugins: [pluginTs()],
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
    dateType = DEFAULT_PARSER_OPTIONS.dateType,
    integerType = DEFAULT_PARSER_OPTIONS.integerType,
    unknownType = DEFAULT_PARSER_OPTIONS.unknownType,
    enumSuffix = DEFAULT_PARSER_OPTIONS.enumSuffix,
    emptySchemaType = unknownType || DEFAULT_PARSER_OPTIONS.emptySchemaType,
  } = options

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
      dateType,
      integerType,
      unknownType,
      emptySchemaType,
      enumSuffix,
      nameMapping,
    },
    getImports(node, resolve) {
      return collectImports({
        node,
        nameMapping,
        resolve: (schemaName) => {
          const result = resolve(schemaName)
          if (!result) return
          return { name: [result.name], path: result.path }
        },
      })
    },
    async parse(source) {
      const fakeConfig = sourceToFakeConfig(source)
      const oas = await parseFromConfig(fakeConfig, oasClass)

      oas.setOptions({ contentType, discriminator })

      if (validate) {
        try {
          await oas.validate()
        } catch (_err) {
          // Validation failures are non-fatal — mirror plugin-oas behavior
        }
      }

      const server = serverIndex !== undefined ? oas.api.servers?.at(serverIndex) : undefined
      const baseURL = server?.url ? resolveServerUrl(server, serverVariables) : undefined

      const parser = createOasParser(oas, { contentType })
      const root = parser.parse({ dateType, integerType, unknownType, emptySchemaType, enumSuffix })

      // This must happen after parse() because legacy enum remapping is finalized there.
      nameMapping.clear()
      for (const [key, value] of parser.nameMapping) {
        nameMapping.set(key, value)
      }

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

/**
 * Adapts an `AdapterSource` to the shape that `parseFromConfig` expects.
 *
 * @example
 * ```ts
 * const config = sourceToFakeConfig({ type: 'path', path: './openapi.yaml' })
 * // { root: '.', input: { path: './openapi.yaml' } }
 * ```
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
