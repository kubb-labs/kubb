import { z } from 'zod'
import { orderSchema } from './orderSchema'

/**
 * @description successful operation
 */
export const placeOrder200Schema = z.lazy(() => orderSchema).schema

/**
 * @description Invalid input
 */
export const placeOrder405Schema = z.any()

export const placeOrderMutationRequestSchema = z.lazy(() => orderSchema).schema

/**
 * @description successful operation
 */
export const placeOrderMutationResponseSchema = z.lazy(() => orderSchema).schema
