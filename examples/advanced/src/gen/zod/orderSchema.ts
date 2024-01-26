import { z } from 'zod'
import type { Order } from '../models/ts/Order'

export const orderSchema = z.object({
  'id': z.number().optional(),
  'petId': z.number().optional(),
  'quantity': z.number().optional(),
  'shipDate': z.date().optional(),
  'status': z.enum([`placed`, `approved`, `delivered`]).describe(`Order Status`).optional(),
  'http_status': z.union([z.literal(200), z.literal(400)]).describe(`HTTP Status`).optional(),
  'complete': z.boolean().optional(),
}) as z.ZodType<Order>
