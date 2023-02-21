import type { Order } from './Order'

export type GetOrderByIdParams = {
  /**
   * @type integer | undefined int64
   */
  orderId?: number | undefined
}

/**
 * @description successful operation
 */
export type GetOrderByIdResponse = Order
