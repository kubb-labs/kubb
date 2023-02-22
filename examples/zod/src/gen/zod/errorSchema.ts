import zod from 'zod'

export const errorSchema = zod.object({
  code: zod.number(),
  message: zod.string(),
})
