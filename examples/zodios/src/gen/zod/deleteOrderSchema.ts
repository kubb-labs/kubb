import z from 'zod'

export const deleteOrderPathParamsSchema = z.object({ orderId: z.number() })
export const deleteOrderRequestSchema = z.any()
export const deleteOrderResponseSchema = z.any()
