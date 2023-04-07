import type { Order } from '../Order'

export type GetOrderByIdPathParams = {
  /**
   * @type integer int64
   */
  orderId: number
}

/**
 * @description Invalid ID supplied
 */
export type GetOrderById400 = any | null

/**
 * @description Order not found
 */
export type GetOrderById404 = any | null

/**
 * @description successful operation
 */
export type GetOrderByIdResponse = Order
