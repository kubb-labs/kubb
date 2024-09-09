import { z } from 'zod'

export const orderSchema = z.object({
  id: z.number().int().optional(),
  petId: z.number().int().optional(),
  quantity: z.number().int().optional(),
  orderType: z.enum(['foo', 'bar']).optional(),
  type: z.string().describe('Order Status').optional(),
  shipDate: z.string().datetime({ offset: true }).optional(),
  status: z.enum(['placed', 'approved', 'delivered']).describe('Order Status').optional(),
  http_status: z
    .union([z.literal(200), z.literal(400)])
    .describe('HTTP Status')
    .optional(),
  complete: z.boolean().optional(),
})

export type OrderSchema = z.infer<typeof orderSchema>
