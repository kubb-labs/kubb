import { Order } from '../Order'

/**
 * @description Invalid ID supplied
 */
export type GetOrderById400 = any

/**
 * @description Order not found
 */
export type GetOrderById404 = any

export type GetOrderByIdPathParams = {
  /**
   * @description ID of order that needs to be fetched
   * @type integer | undefined int64
   */
  orderId?: number
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
