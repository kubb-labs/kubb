import type { Order } from '../Order.ts'

/**
 * @description successful operation
 */
export type PlaceOrderPatchStatus200 = Order

export type PlaceOrderPatchData = Order

export interface PlaceOrderPatchRequestConfig {
  data?: PlaceOrderPatchData
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/store/order'
}

export interface PlaceOrderPatchResponses {
  '200': PlaceOrderPatchStatus200
}

/**
 * @description Union of all possible responses
 */
export type PlaceOrderPatchResponse = PlaceOrderPatchStatus200
