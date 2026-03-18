import type { Order } from '../Order.ts'

/**
 * @description successful operation
 */
export type PlaceOrderPatchStatus200 = Order

export type PlaceOrderPatchMutationRequest = Order

export interface PlaceOrderPatchRequestConfig {
  data?: PlaceOrderPatchMutationRequest
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
