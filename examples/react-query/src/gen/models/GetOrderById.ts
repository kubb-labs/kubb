// version: 1.0.11
import type { Order } from './Order.ts'

export type GetOrderByIdPathParams = {
  /**
   * @description ID of order that needs to be fetched
   * @type integer, int64
   */
  orderId: number
}

/**
 * @description successful operation
 */
export type GetOrderById200 = Order

/**
 * @description Invalid ID supplied
 */
export type GetOrderById400 = any

/**
 * @description Order not found
 */
export type GetOrderById404 = any

export type GetOrderByIdQueryResponse = GetOrderById200

export type GetOrderByIdQuery = {
  Response: GetOrderById200
  PathParams: GetOrderByIdPathParams
  Errors: GetOrderById400 | GetOrderById404
}