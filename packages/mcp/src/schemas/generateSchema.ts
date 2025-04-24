import { z } from 'zod'

export const generateSchema = z.object({
  openApi: z.string().default('https://petstore.swagger.io/v2/swagger.json').describe('OpenAPI/Swagger spec'),
  plugin: z.enum(['typescript', 'react-query']).describe('Plugin to use'),
  operationId: z.string().nullable().optional().describe('Which operationId should be used'),
  // schemaName: z.string().nullable().optional().describe('Which schema should be used'),
})
