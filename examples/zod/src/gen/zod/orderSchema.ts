import zod from 'zod'

export const orderSchema = zod.object({
  id: zod.number().optional(),
  petId: zod.number().optional(),
  quantity: zod.number().optional(),
  shipDate: zod.string().optional(),
  status: zod.enum(['placed', 'approved', 'delivered']).describe('Order Status').optional(),
  complete: zod.boolean().optional(),
})
