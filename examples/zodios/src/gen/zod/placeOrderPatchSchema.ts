import { z } from 'zod'
import { orderSchema } from './orderSchema'

/**
 * @description Invalid input
 */
export const placeOrderPatch405Schema = z.any()

/**
 * @description successful operation
 */
export const placeOrderPatch200Schema = z.lazy(() => orderSchema)
export const placeOrderPatchMutationRequestSchema = z.lazy(() => orderSchema)

/**
 * @description successful operation
 */
export const placeOrderPatchMutationResponseSchema = z.lazy(() => orderSchema)
