import type { Order } from '../../models/ts/Order'

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
