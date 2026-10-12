import { z } from '@kubb/kit'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'

const dateTimeTypeSchema = z.union([z.literal(false), z.enum(['string', 'stringOffset', 'stringLocal', 'date'])])

const dateOnlyTypeSchema = z.union([z.literal(false), z.enum(['string', 'date'])])

const typeFallbackSchema = z.enum(['any', 'unknown', 'void'])

/**
 * Mirrors `ParserOptions` from `@kubb/ast`: how schemas map to AST nodes.
 */
const parserOptionsSchema = z.object({
  dateType: z
    .union([
      dateTimeTypeSchema,
      z.object({
        dateTime: dateTimeTypeSchema.optional(),
        date: dateOnlyTypeSchema.optional(),
        time: dateOnlyTypeSchema.optional(),
      }),
    ])
    .default(DEFAULT_PARSER_OPTIONS.dateType)
    .meta({
      description:
        'How `date-time`, `date`, and `time` formatted schemas are represented downstream. A scalar value applies to all three formats. Pass `{ dateTime, date, time }` to set each format independently.',
    }),
  integerType: z.enum(['number', 'bigint']).default(DEFAULT_PARSER_OPTIONS.integerType).meta({
    description:
      "How `type: 'integer'` (and `format: 'int64'`) maps to TypeScript. `'bigint'` is exact for 64-bit IDs, `'number'` fits most JSON APIs but loses precision above `Number.MAX_SAFE_INTEGER`.",
  }),
  unknownType: typeFallbackSchema
    .default(DEFAULT_PARSER_OPTIONS.unknownType)
    .meta({ description: "AST type used when a schema's type cannot be inferred from the spec (`additionalProperties: true`, missing `type`, ...)." }),
  emptySchemaType: typeFallbackSchema.optional().meta({ description: 'AST type used for completely empty schemas (`{}`). Defaults to `unknownType`.' }),
  enumSuffix: z
    .suggest(['enum'])
    .default(DEFAULT_PARSER_OPTIONS.enumSuffix)
    .meta({ description: 'Suffix appended to derived enum names when Kubb has to invent one, typically for inline enums on object properties.' }),
})

/**
 * Options schema of `adapterOas`. Mirrors `AdapterOasOptions` and applies its defaults, except for
 * `emptySchemaType`, which follows `unknownType` and is resolved in the adapter's `setup`.
 */
export const optionsSchema = parserOptionsSchema.extend({
  validate: z.boolean().default(true).meta({
    description:
      'Validate the OpenAPI spec before parsing. Each problem is reported as a `KUBB_INVALID_SPEC` warning and generation continues. Set to `false` to skip the check, which also makes generation faster on a large spec.',
  }),
  contentType: z
    .suggest(['application/json'])
    .optional()
    .meta({ description: 'Preferred media type when an operation defines several. Defaults to the first JSON-compatible media type found in the spec.' }),
  server: z
    .object({
      index: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .meta({ description: 'Index into the `servers` array from your OpenAPI spec. Omit to leave `baseURL` undefined.' }),
      variables: z
        .record(z.string(), z.string())
        .optional()
        .meta({ description: 'Override values for `{variable}` placeholders in the selected server URL. Variables you leave out use their spec default.' }),
    })
    .optional()
    .meta({ description: 'Selects the server entry used to compute the base URL and overrides its `{variable}` placeholders.' }),
  discriminator: z.enum(['preserve', 'propagate']).default('preserve').meta({
    description:
      "How the `discriminator` field on `oneOf`/`anyOf` schemas is interpreted. `'preserve'` keeps child schemas as written, `'propagate'` pushes the discriminator value as a literal into each child schema.",
  }),
  enums: z.enum(['inline', 'root']).default('inline').meta({
    description:
      "Where inline enums live. `'inline'` keeps each enum on the property that declares it, `'root'` lifts every inline enum to a reusable top-level schema.",
  }),
})
