import * as v from 'valibot'

export const validateSchema = v.object({
  input: v.pipe(v.string(), v.minLength(1), v.description('Path or URL to the OpenAPI/Swagger specification')),
})
