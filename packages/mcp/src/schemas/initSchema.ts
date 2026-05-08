import { z } from 'zod'

export const initSchema = z.object({
  input: z.string().optional().describe('Path to OpenAPI spec (default: ./openapi.yaml)'),
  output: z.string().optional().describe('Output directory (default: ./src/gen)'),
  plugins: z.string().optional().describe('Comma-separated list of plugins: plugin-ts,plugin-zod,...'),
})
