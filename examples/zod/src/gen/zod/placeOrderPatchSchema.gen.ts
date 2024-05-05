import { z } from 'zod'
import { orderSchema } from './orderSchema.gen'

/**
 * @description successful operation
 */
export const placeOrderPatch200Schema = z.lazy(() => orderSchema).schema

/**
 * @description Invalid input
 */
export const placeOrderPatch405Schema = z.any()

export const placeOrderPatchMutationRequestSchema = z.lazy(() => orderSchema).schema

/**
 * @description successful operation
 */
export const placeOrderPatchMutationResponseSchema = z.lazy(() => orderSchema).schema
