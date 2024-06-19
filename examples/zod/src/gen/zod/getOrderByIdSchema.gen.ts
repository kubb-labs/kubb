import { z } from '../../zod.ts'
import { orderSchema } from './orderSchema.gen'

export const getOrderByIdPathParamsSchema = z.object({ orderId: z.coerce.number().describe('ID of order that needs to be fetched') })
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
