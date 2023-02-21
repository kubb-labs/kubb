import zod from 'zod'

import { Order } from './Order'

export const GetOrderByIdParams = zod.object({ orderId: zod.number().optional() })
export const GetOrderByIdResponse = Order
