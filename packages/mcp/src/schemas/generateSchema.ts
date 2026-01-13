import { z } from 'zod'

export const generateSchema = z.object({
  config: z
    .string()
    .optional()
    .default('kubb.config.ts')
    .describe('Path to kubb.config file (supports .ts, .js, .cjs). If not provided, will look for kubb.config.{ts,js,cjs} in current directory'),
  input: z.string().optional().describe('Path to OpenAPI/Swagger spec file (overrides config)'),
  output: z.string().optional().describe('Output directory path (overrides config)'),
  watch: z.boolean().optional().default(false).describe('Enable watch mode for file changes'),
  logLevel: z.enum(['silent', 'error', 'warn', 'info', 'verbose', 'debug']).optional().default('info').describe('Log level for build output'),
})

