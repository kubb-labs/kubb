import type { Order } from '../Order.ts'

/**
 * @description successful operation
 */
export type PlaceOrder200 = Order

/**
 * @description Order description
 */
export type PlaceOrderMutationRequest = Order

export interface PlaceOrderData {
  data?: PlaceOrderMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/store/order'
}

export interface PlaceOrderResponses {
  '200': PlaceOrder200
}

export type PlaceOrderResponse = PlaceOrder200
