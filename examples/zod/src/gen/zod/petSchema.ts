import zod from 'zod'

export const petSchema = zod.object({
  id: zod.number(),
  name: zod.string(),
  tag: zod.string().optional(),
})
