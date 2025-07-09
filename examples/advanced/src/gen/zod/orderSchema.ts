import { z } from 'zod/v4'

export const orderSchema = z.object({
  id: z.int().min(3).max(100).optional(),
  petId: z.int().optional(),
  quantity: z.int().optional(),
  orderType: z.enum(['foo', 'bar']).optional(),
  type: z.string().describe('Order Status').optional(),
  shipDate: z.iso.datetime({ offset: true }).optional(),
  status: z.enum(['placed', 'approved', 'delivered']).describe('Order Status').optional(),
  http_status: z
    .union([z.literal(200), z.literal(400)])
    .describe('HTTP Status')
    .optional(),
  complete: z.boolean().optional(),
})

export type OrderSchema = z.infer<typeof orderSchema>
