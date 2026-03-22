import type { Order } from '../Order.ts'

export type GetOrderByIdPathParams = {
  /**
   * @description ID of order that needs to be fetched
   * @type integer
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
  /**
   * @type object
   */
  Response: GetOrderById200
  /**
   * @type object
   */
  PathParams: GetOrderByIdPathParams
  Errors: GetOrderById400 | GetOrderById404
}
