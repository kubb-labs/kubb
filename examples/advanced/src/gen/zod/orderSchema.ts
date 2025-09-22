import type { Order } from '../models/ts/Order.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const orderSchema = z.object({
  id: z.optional(z.int().min(3).max(100)),
  petId: z.optional(z.int()),
  quantity: z.optional(z.int()),
  orderType: z.optional(z.enum(['foo', 'bar'])),
  type: z.optional(z.string().describe('Order Status')),
  shipDate: z.optional(z.iso.datetime({ offset: true })),
  status: z.optional(z.enum(['placed', 'approved', 'delivered']).describe('Order Status')),
  http_status: z.optional(z.union([z.literal(200), z.literal(400)]).describe('HTTP Status')),
  complete: z.optional(z.boolean()),
}) as unknown as ToZod<Order>

export type OrderSchema = Order
