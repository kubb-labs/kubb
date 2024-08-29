import { z } from '../../zod.ts'
import { orderSchema } from './orderSchema.gen.ts'

/**
 * @description successful operation
 */
export const placeOrderPatch200Schema = z.lazy(() => orderSchema)

export type PlaceOrderPatch200Schema = z.infer<typeof placeOrderPatch200Schema>

/**
 * @description Invalid input
 */
export const placeOrderPatch405Schema = z.any()

export type PlaceOrderPatch405Schema = z.infer<typeof placeOrderPatch405Schema>

export const placeOrderPatchMutationRequestSchema = z.lazy(() => orderSchema)

export type PlaceOrderPatchMutationRequestSchema = z.infer<typeof placeOrderPatchMutationRequestSchema>

/**
 * @description successful operation
 */
export const placeOrderPatchMutationResponseSchema = z.lazy(() => orderSchema)

export type PlaceOrderPatchMutationResponseSchema = z.infer<typeof placeOrderPatchMutationResponseSchema>
