import { z } from 'zod'

export const deleteOrderPathParamsSchema = z.object({ orderId: z.coerce.number().describe('ID of the order that needs to be deleted') })
/**
 * @description Invalid ID supplied
 */
export const deleteOrder400Schema = z.any()
/**
 * @description Order not found
 */
export const deleteOrder404Schema = z.any()

export const deleteOrderMutationResponseSchema = z.any()
