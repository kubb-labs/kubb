import type { OrderType } from './OrderType.ts'

export type GetOrderByIdPathParamsType = {
  /**
   * @description ID of order that needs to be fetched
   * @type integer, int64
   */
  orderId: number
}

/**
 * @description successful operation
 */
export type GetOrderById200Type = OrderType

/**
 * @description Invalid ID supplied
 */
export type GetOrderById400Type = any

/**
 * @description Order not found
 */
export type GetOrderById404Type = any

export type GetOrderByIdQueryResponseType = GetOrderById200Type

export type GetOrderByIdTypeQuery = {
  Response: GetOrderById200Type
  PathParams: GetOrderByIdPathParamsType
  Errors: GetOrderById400Type | GetOrderById404Type
}
