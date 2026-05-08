import * as v from 'valibot'

export const generateSchema = v.object({
  config: v.optional(
    v.pipe(v.string(), v.minLength(1), v.description('Path to kubb.config file (supports .ts, .js, .cjs). If not provided, will look for kubb.config.{ts,js,cjs} in current directory')),
  ),
  input: v.optional(v.pipe(v.string(), v.minLength(1), v.description('Path to OpenAPI/Swagger spec file (overrides config)'))),
  output: v.optional(v.pipe(v.string(), v.minLength(1), v.description('Output directory path (overrides config)'))),
  logLevel: v.optional(
    v.pipe(v.picklist(['silent', 'error', 'warn', 'info', 'verbose', 'debug']), v.description('Log level for build output')),
    'info',
  ),
})
