import type { Order } from './Order'

export type GetOrderByIdPathParams = {
  /**
   * @type integer | undefined int64
   */
  orderId?: number | undefined
}

export type GetOrderByIdQueryParams = {}

/**
 * @description successful operation
 */
export type GetOrderByIdResponse = Order
