import * as z from 'zod'

export const orderSchema = z.object({
  id: z.int().min(3).max(100).optional(),
  petId: z.int().optional(),
  params: z
    .object({
      status: z.enum(['placed', 'approved', 'delivered']).describe('Order Status'),
      type: z.string(),
    })
    .optional(),
  quantity: z.int().optional(),
  orderType: z.enum(['foo', 'bar']).optional(),
  type: z.string().optional().describe('Order Status'),
  shipDate: z.iso.datetime().optional(),
  status: z.enum(['placed', 'approved', 'delivered']).optional().describe('Order Status'),
  http_status: z
    .union([z.literal(200), z.literal(400)])
    .optional()
    .describe('HTTP Status'),
  complete: z.boolean().optional(),
})

export type OrderSchema = z.infer<typeof orderSchema>
