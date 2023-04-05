import z from 'zod'

import { orderSchema } from '../orderSchema'

export const placeOrderRequestSchema = z.lazy(() => orderSchema)

/**
 * @description successful operation
 */
export const placeOrderResponseSchema = z.lazy(() => orderSchema)
