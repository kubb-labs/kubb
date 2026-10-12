import * as z from 'zod'

const extnameSchema = z.templateLiteral(['.', z.string()])

/**
 * Options schema of `parserTs` and `parserTsx`. Mirrors `ParserTsOptions` and applies its default.
 */
export const optionsSchema = z.object({
  extension: z
    .record(extnameSchema, z.union([extnameSchema, z.literal('')]))
    .default({ '.ts': '' })
    .meta({
      description:
        "Rewrite extensions on relative `import`/`export` statements. Keys are the source extension, values the output, and `''` drops it. Package specifiers stay unchanged. Also applies to relative paths in `copy` templates.",
    }),
})
