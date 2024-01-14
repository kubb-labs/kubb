import { z } from 'zod'

export const orderSchema = z.object({
  'id': z.number().optional(),
  'petId': z.number().optional(),
  'quantity': z.number().optional(),
  'shipDate': z.string().datetime().optional(),
  'status': z.enum([`placed`, `approved`, `delivered`]).describe(`Order Status`).optional(),
  'http_status': z.enum([`ok`, `not_found`]).describe(`HTTP Status`).optional(),
  'complete': z.boolean().optional(),
})
