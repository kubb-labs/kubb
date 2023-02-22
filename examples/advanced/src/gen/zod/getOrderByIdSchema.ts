import zod from 'zod'

import { orderSchema } from './orderSchema'

export const getOrderByIdPathParamsSchema = zod.object({ orderId: zod.number().optional() })
export const getOrderByIdQueryParamsSchema = zod.object({})
export const getOrderByIdResponseSchema = orderSchema
