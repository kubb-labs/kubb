import type { Order } from '../Order.ts'

/**
 * @description successful operation
 */
export type PlaceOrderPatch200 = Order

export type PlaceOrderPatchMutationRequest = Order

export interface PlaceOrderPatchData {
  data?: PlaceOrderPatchMutationRequest
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/store/order'
}

export interface PlaceOrderPatchResponses {
  '200': PlaceOrderPatch200
}

export type PlaceOrderPatchResponse = PlaceOrderPatch200
