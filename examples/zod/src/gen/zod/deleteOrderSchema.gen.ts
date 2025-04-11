import type { DeleteOrderPathParamsType, DeleteOrder400Type, DeleteOrder404Type, DeleteOrderMutationResponseType } from '../ts/DeleteOrderType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'

export const deleteOrderPathParamsSchema = z.object({
  orderId: z.number().int().describe('ID of the order that needs to be deleted'),
}) as unknown as ToZod<DeleteOrderPathParamsType>

export type DeleteOrderPathParamsSchema = DeleteOrderPathParamsType

/**
 * @description Invalid ID supplied
 */
export const deleteOrder400Schema = z.any() as unknown as ToZod<DeleteOrder400Type>

export type DeleteOrder400Schema = DeleteOrder400Type

/**
 * @description Order not found
 */
export const deleteOrder404Schema = z.any() as unknown as ToZod<DeleteOrder404Type>

export type DeleteOrder404Schema = DeleteOrder404Type

export const deleteOrderMutationResponseSchema = z.any() as unknown as ToZod<DeleteOrderMutationResponseType>

export type DeleteOrderMutationResponseSchema = DeleteOrderMutationResponseType