import z from 'zod'

import { orderSchema } from './orderSchema'

/**
 * @description Invalid input
 */
export const placeOrder405Schema = z.any()
export const placeOrderRequestSchema = z.lazy(() => orderSchema)

/**
 * @description successful operation
 */
export const placeOrderResponseSchema = z.lazy(() => orderSchema)
