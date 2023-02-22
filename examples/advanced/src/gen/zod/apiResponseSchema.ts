import zod from 'zod'

export const apiResponseSchema = zod.object({
  code: zod.number().optional(),
  type: zod.string().optional(),
  message: zod.string().optional(),
})
