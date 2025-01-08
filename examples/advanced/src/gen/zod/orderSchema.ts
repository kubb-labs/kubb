import type { Order } from '../models/ts/Order.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

export const orderSchema = z.object({
  id: z.number().int().min(3).max(100).optional(),
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
} satisfies ToZod<Order>)

export type OrderSchema = Order
