import zod from 'zod'

import { orderSchema } from './orderSchema'

export const getOrderByIdParamsSchema = zod.object({ orderId: zod.number().optional() })
export const getOrderByIdResponseSchema = orderSchema
