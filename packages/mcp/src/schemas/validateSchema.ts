import { z } from 'zod'

export const validateSchema = z.object({
  input: z.string().describe('Path or URL to the OpenAPI/Swagger specification'),
})
