import z from 'zod'

export const deleteOrderPathParamsSchema = z.object({ orderId: z.number() })
export const deleteOrderRequestSchema = z.any()
export const deleteOrderResponseSchema = z.any()

/**
 * @description Invalid ID supplied
 */
export const deleteOrder400Schema = z.any()

/**
 * @description Order not found
 */
export const deleteOrder404Schema = z.any()
