import path from 'node:path'
import type { RootNode } from '@kubb/ast/types'
import type { Adapter, AdapterSource } from '@kubb/core'
import type { Oas as OasClass } from '@kubb/oas'
import { parseFromConfig } from '@kubb/oas'
import { createOasParser } from './parser.ts'

type OasAdapterOptions = {
  /**
   * Validate the OpenAPI spec before parsing.
   * @default true
   */
  validate?: boolean
  /**
   * Override the `Oas` class (e.g. for custom subclass behavior).
   */
  oasClass?: typeof OasClass
  /**
   * Restrict which content-type is used when extracting request/response schemas.
   * By default the first valid JSON media type is used.
   */
  contentType?: string
  /**
   * How the discriminator field should be interpreted.
   * - `'strict'`  — uses `oneOf` schemas as defined.
   * - `'inherit'` — replaces `oneOf` with the schema from `discriminator.mapping`.
   * @default 'strict'
   */
  discriminator?: 'strict' | 'inherit'
  /**
   * Automatically resolve name collisions across schema components.
   * @default false
   */
  collisionDetection?: boolean
  /**
   * How `format: 'date-time'` schemas are represented.
   * @default 'string'
   */
  dateType?: false | 'string' | 'stringOffset' | 'stringLocal' | 'date'
  /**
   * Whether `type: 'integer'` produces `number` or `bigint` nodes.
   * @default 'number'
   */
  integerType?: 'number' | 'bigint'
  /**
   * AST type used when no schema type can be inferred.
   * @default 'any'
   */
  unknownType?: 'any' | 'unknown' | 'void'
}

export const adapterOasName = 'oas' as const

/**
 * Creates an OpenAPI / Swagger adapter for Kubb.
 *
 * This is the default adapter — you can omit it from your config when using
 * an OpenAPI spec, but supplying it explicitly lets you pass options.
 *
 * Inspired by the adapter pattern from [Better Auth](https://better-auth.com/docs/adapters/drizzle).
 *
 * @example
 * ```ts
 * import { defineConfig } from '@kubb/core'
 * import { oasAdapter } from '@kubb/adapter-oas'
 *
 * export default defineConfig({
 *   adapter: oasAdapter({ validate: true }),
 *   input:   { path: './openapi.yaml' },
 *   plugins: [pluginTs(), pluginZod()],
 * })
 * ```
 */
export function adapterOas(options: OasAdapterOptions = {}): Adapter {
  const {
    validate = true,
    oasClass,
    contentType,
    discriminator = 'strict',
    collisionDetection = false,
    dateType = 'string',
    integerType = 'number',
    unknownType = 'any',
  } = options

  return {
    name: 'oas',
    async parse(source: AdapterSource): Promise<RootNode> {
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

      const parser = createOasParser(oas, { contentType, collisionDetection })
      return parser.buildAst({ dateType, integerType, unknownType, emptySchemaType: unknownType, enumSuffix: 'enum' })
    },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Maps an `AdapterSource` back to the minimal Config shape that
 * `parseFromConfig` from `@kubb/oas` expects.
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
