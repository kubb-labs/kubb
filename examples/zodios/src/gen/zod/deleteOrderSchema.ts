import { z } from 'zod'

/**
 * @description Invalid ID supplied
 */
export const deleteOrder400Schema = z.any()

/**
 * @description Order not found
 */
export const deleteOrder404Schema = z.any()

export const deleteOrderMutationResponseSchema = z.any()

export const deleteOrderPathParamsSchema = z.object({ orderId: z.number().describe('ID of the order that needs to be deleted') })
