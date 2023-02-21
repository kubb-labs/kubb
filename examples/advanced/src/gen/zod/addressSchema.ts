import zod from 'zod'

export const addressSchema = zod.object({
  street: zod.string().optional(),
  city: zod.string().optional(),
  state: zod.string().optional(),
  zip: zod.string().optional(),
})
