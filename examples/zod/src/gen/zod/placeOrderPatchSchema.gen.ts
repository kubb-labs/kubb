import { z } from '../../zod.ts'
import { orderSchema } from './orderSchema.gen'

/**
 * @description successful operation
 */
export const placeOrderPatch200Schema = z.lazy(() => orderSchema)
/**
 * @description Invalid input
 */
export const placeOrderPatch405Schema = z.any()

export const placeOrderPatchMutationRequestSchema = z.lazy(() => orderSchema)
/**
 * @description successful operation
 */
export const placeOrderPatchMutationResponseSchema = z.lazy(() => orderSchema)
