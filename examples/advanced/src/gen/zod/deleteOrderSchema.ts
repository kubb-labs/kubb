import zod from 'zod'

export const deleteOrderPathParamsSchema = zod.object({ orderId: zod.number().optional() })
export const deleteOrderRequestSchema = zod.any()
export const deleteOrderResponseSchema = zod.any()
