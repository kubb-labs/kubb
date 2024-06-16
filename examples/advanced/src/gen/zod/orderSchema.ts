import { z } from 'zod'
import type { Order } from '../models/ts/Order'

export const orderSchema = z.object({
  id: z.coerce.number().optional(),
  petId: z.coerce.number().optional(),
  quantity: z.coerce.number().optional(),
  orderType: z.enum(['foo', 'bar']).optional(),
  type: z.coerce.string().describe('Order Status').optional(),
  shipDate: z.string().datetime({ offset: true }).optional(),
  status: z.enum(['placed', 'approved', 'delivered']).describe('Order Status').optional(),
  http_status: z
    .union([z.literal(200), z.literal(400)])
    .describe('HTTP Status')
    .optional(),
  complete: z.boolean().optional(),
}) as z.ZodType<Order>
