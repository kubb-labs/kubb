import type { OrderType } from './OrderType'

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

/**
 * @description successful operation
 */
export type GetOrderByIdQueryResponseType = OrderType

export type GetOrderByIdTypeQuery = {
  Response: GetOrderByIdQueryResponseType
  PathParams: GetOrderByIdPathParamsType
  Errors: GetOrderById400Type | GetOrderById404Type
}
