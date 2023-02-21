import zod from 'zod'

export const Order = zod.object({
  id: zod.number().optional(),
  petId: zod.number().optional(),
  quantity: zod.number().optional(),
  shipDate: zod.string().optional(),
  status: zod.string().optional().describe('Order Status'),
  complete: zod.boolean().optional(),
})
