import zod from 'zod'

export const personSchema = zod.object({
  id: zod.number(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
  age: zod.number().optional(),
  address: zod.string().optional(),
})
