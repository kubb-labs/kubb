import { z } from 'zod'

export const orderSchema = z.object({
  id: z.number().int().optional(),
  petId: z.number().int().optional(),
  quantity: z.number().int().optional(),
  shipDate: z.string().datetime().optional(),
  status: z.enum(['placed', 'approved', 'delivered']).describe('Order Status').optional(),
  http_status: z
    .union([z.literal(200), z.literal(400), z.literal(500)])
    .describe('HTTP Status')
    .optional(),
  complete: z.boolean().optional(),
})
