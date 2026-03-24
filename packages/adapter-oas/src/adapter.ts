import { collectImports, createRoot } from '@kubb/ast'
import { createAdapter } from '@kubb/core'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { applyDiscriminatorInheritance } from './discriminator.ts'
import { parseFromConfig, validateDocument } from './factory.ts'
import { resolveServerUrl } from './resolvers.ts'
import { parseOas } from './transformers.ts'
import type { AdapterOas } from './types.ts'

/**
 * Stable string identifier for the OAS adapter used in Kubb's adapter registry.
 */
export const adapterOasName = 'oas' satisfies AdapterOas['name']

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
export const adapterOas = createAdapter<AdapterOas>((options) => {
  const {
    validate = true,
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
      const document = await parseFromConfig(source)

      if (validate) {
        await validateDocument(document)
      }

      const server = serverIndex !== undefined ? document.servers?.at(serverIndex) : undefined
      const baseURL = server?.url ? resolveServerUrl(server, serverVariables) : undefined

      const { root: parsedRoot, nameMapping: parsedNameMapping } = parseOas(document, {
        contentType,
        dateType,
        integerType,
        unknownType,
        emptySchemaType,
        enumSuffix,
      })

      const root = discriminator === 'inherit' ? applyDiscriminatorInheritance(parsedRoot) : parsedRoot

      // This must happen after parseOas() because legacy enum remapping is finalized there.
      nameMapping.clear()
      for (const [key, value] of parsedNameMapping) {
        nameMapping.set(key, value)
      }

      return createRoot({
        ...root,
        meta: {
          title: document.info?.title,
          description: document.info?.description,
          version: document.info?.version,
          baseURL,
        },
      })
    },
  }
})
