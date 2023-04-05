import type { Order } from '../Order'

export type GetOrderByIdPathParams = {
  /**
   * @type integer int64
   */
  orderId: number
}

/**
 * @description successful operation
 */
export type GetOrderByIdResponse = Order
