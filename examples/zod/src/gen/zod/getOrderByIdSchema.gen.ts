import { z } from '../../zod.ts'
import { orderSchema } from './orderSchema.gen.ts'

export const getOrderByIdPathParamsSchema = z.object({ orderId: z.number().int().describe('ID of order that needs to be fetched') })

export type GetOrderByIdPathParamsSchema = z.infer<typeof getOrderByIdPathParamsSchema>

/**
 * @description successful operation
 */
export const getOrderById200Schema = z.lazy(() => orderSchema)

export type GetOrderById200Schema = z.infer<typeof getOrderById200Schema>

/**
 * @description Invalid ID supplied
 */
export const getOrderById400Schema = z.any()

export type GetOrderById400Schema = z.infer<typeof getOrderById400Schema>

/**
 * @description Order not found
 */
export const getOrderById404Schema = z.any()

export type GetOrderById404Schema = z.infer<typeof getOrderById404Schema>

/**
 * @description successful operation
 */
export const getOrderByIdQueryResponseSchema = z.lazy(() => orderSchema)

export type GetOrderByIdQueryResponseSchema = z.infer<typeof getOrderByIdQueryResponseSchema>
