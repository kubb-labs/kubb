import { z } from '../../zod.ts'
import { orderSchema } from './orderSchema.gen.ts'

/**
 * @description successful operation
 */
export const placeOrder200Schema = z.lazy(() => orderSchema)

export type PlaceOrder200Schema = z.infer<typeof placeOrder200Schema>

/**
 * @description Invalid input
 */
export const placeOrder405Schema = z.any()

export type PlaceOrder405Schema = z.infer<typeof placeOrder405Schema>

export const placeOrderMutationRequestSchema = z.lazy(() => orderSchema)

export type PlaceOrderMutationRequestSchema = z.infer<typeof placeOrderMutationRequestSchema>

/**
 * @description successful operation
 */
export const placeOrderMutationResponseSchema = z.lazy(() => orderSchema)

export type PlaceOrderMutationResponseSchema = z.infer<typeof placeOrderMutationResponseSchema>
