import { z } from '../../zod.ts'

export const orderSchema = z.object({
  id: z.int().optional(),
  petId: z.int().optional(),
  quantity: z.int().optional(),
  shipDate: z.string().datetime().optional(),
  status: z.enum(['placed', 'approved', 'delivered']).describe('Order Status').optional(),
  http_status: z
    .union([z.literal(200), z.literal(400)])
    .describe('HTTP Status')
    .optional(),
  complete: z.boolean().optional(),
})

export type OrderSchema = z.infer<typeof orderSchema>
