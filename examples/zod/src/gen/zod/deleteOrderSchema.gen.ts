import { z } from '../../zod.ts'

export const deleteOrderPathParamsSchema = z.object({ orderId: z.number().describe('ID of the order that needs to be deleted') })

export type DeleteOrderPathParamsSchema = z.infer<typeof deleteOrderPathParamsSchema>

/**
 * @description Invalid ID supplied
 */
export const deleteOrder400Schema = z.any()

export type DeleteOrder400Schema = z.infer<typeof deleteOrder400Schema>

/**
 * @description Order not found
 */
export const deleteOrder404Schema = z.any()

export type DeleteOrder404Schema = z.infer<typeof deleteOrder404Schema>

export const deleteOrderMutationResponseSchema = z.any()

export type DeleteOrderMutationResponseSchema = z.infer<typeof deleteOrderMutationResponseSchema>
