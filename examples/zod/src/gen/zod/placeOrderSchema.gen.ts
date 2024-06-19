import { z } from '../../zod.ts'
import { orderSchema } from './orderSchema.gen'

/**
 * @description successful operation
 */
export const placeOrder200Schema = z.lazy(() => orderSchema)
/**
 * @description Invalid input
 */
export const placeOrder405Schema = z.any()

export const placeOrderMutationRequestSchema = z.lazy(() => orderSchema)
/**
 * @description successful operation
 */
export const placeOrderMutationResponseSchema = z.lazy(() => orderSchema)
