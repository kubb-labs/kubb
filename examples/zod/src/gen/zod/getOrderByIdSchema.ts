import { z } from 'zod'
import { orderSchema } from './orderSchema'

export const getOrderByIdPathParamsSchema = z.object({ orderId: z.number().describe('ID of order that needs to be fetched') })

/**
 * @description successful operation
 */
export const getOrderById200Schema = z.lazy(() => orderSchema)

/**
 * @description Invalid ID supplied
 */
export const getOrderById400Schema = z.any()

/**
 * @description Order not found
 */
export const getOrderById404Schema = z.any()

/**
 * @description successful operation
 */
export const getOrderByIdQueryResponseSchema = z.lazy(() => orderSchema)
