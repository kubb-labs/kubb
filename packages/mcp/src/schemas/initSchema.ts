import * as v from 'valibot'

export const initSchema = v.object({
  input: v.optional(v.pipe(v.string(), v.minLength(1), v.description('Path to OpenAPI spec (default: ./openapi.yaml)'))),
  output: v.optional(v.pipe(v.string(), v.minLength(1), v.description('Output directory (default: ./src/gen)'))),
  plugins: v.optional(v.pipe(v.string(), v.minLength(1), v.description('Comma-separated list of plugins: plugin-ts,plugin-zod,...'))),
})
