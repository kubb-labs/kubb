import z from 'zod'

export const orderSchema = z.object({
  id: z.number().optional(),
  petId: z.number().optional(),
  quantity: z.number().optional(),
  shipDate: z.string().optional(),
  status: z.enum([`placed`, `approved`, `delivered`]).describe(`Order Status`).optional(),
  complete: z.boolean().optional(),
})
