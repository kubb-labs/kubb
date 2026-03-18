import type { Order } from '../Order.ts'

/**
 * @description successful operation
 */
export type PlaceOrderStatus200 = Order

/**
 * @description Order description
 */
export type PlaceOrderMutationRequest = Order

export interface PlaceOrderRequestConfig {
  data?: PlaceOrderMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/store/order'
}

export interface PlaceOrderResponses {
  '200': PlaceOrderStatus200
}

/**
 * @description Union of all possible responses
 */
export type PlaceOrderResponse = PlaceOrderStatus200
