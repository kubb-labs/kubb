import type { Order } from '../Order'

/**
 * @description Invalid ID supplied
 */
export type GetOrderById400 = any | null

/**
 * @description Order not found
 */
export type GetOrderById404 = any | null

export type GetOrderByIdPathParams = {
  /**
   * @description ID of order that needs to be fetched
   * @type integer int64
   */
  orderId: number
}

/**
 * @description successful operation
 */
export type GetOrderById200 = Order

/**
 * @description successful operation
 */
export type GetOrderByIdQueryResponse = Order
export type GetOrderByIdQuery = {
  Response: GetOrderByIdQueryResponse
  PathParams: GetOrderByIdPathParams
  Errors: GetOrderById400 | GetOrderById404
}
