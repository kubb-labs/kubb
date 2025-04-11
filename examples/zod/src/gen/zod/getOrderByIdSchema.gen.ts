import type {
  GetOrderByIdPathParamsType,
  GetOrderById200Type,
  GetOrderById400Type,
  GetOrderById404Type,
  GetOrderByIdQueryResponseType,
} from '../ts/GetOrderByIdType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { orderSchema } from './orderSchema.gen.ts'

export const getOrderByIdPathParamsSchema = z.object({
  orderId: z.number().int().describe('ID of order that needs to be fetched'),
}) as unknown as ToZod<GetOrderByIdPathParamsType>

export type GetOrderByIdPathParamsSchema = GetOrderByIdPathParamsType

/**
 * @description successful operation
 */
export const getOrderById200Schema = z.lazy(() => orderSchema) as unknown as ToZod<GetOrderById200Type>

export type GetOrderById200Schema = GetOrderById200Type

/**
 * @description Invalid ID supplied
 */
export const getOrderById400Schema = z.any() as unknown as ToZod<GetOrderById400Type>

export type GetOrderById400Schema = GetOrderById400Type

/**
 * @description Order not found
 */
export const getOrderById404Schema = z.any() as unknown as ToZod<GetOrderById404Type>

export type GetOrderById404Schema = GetOrderById404Type

export const getOrderByIdQueryResponseSchema = z.lazy(() => getOrderById200Schema) as unknown as ToZod<GetOrderByIdQueryResponseType>

export type GetOrderByIdQueryResponseSchema = GetOrderByIdQueryResponseType
