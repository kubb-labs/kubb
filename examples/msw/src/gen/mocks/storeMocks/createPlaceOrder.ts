import { createOrder } from '../createOrder'
import type { PlaceOrder405, PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../../models/PlaceOrder'

/**
 * @description Invalid input
 */

export function createPlaceOrder405(override?: Partial<PlaceOrder405>): NonNullable<PlaceOrder405> {
  return undefined
}

export function createPlaceOrderMutationRequest(override?: Partial<PlaceOrderMutationRequest>): NonNullable<PlaceOrderMutationRequest> {
  return createOrder(override)
}
/**
 * @description successful operation
 */

export function createPlaceOrderMutationResponse(override?: Partial<PlaceOrderMutationResponse>): NonNullable<PlaceOrderMutationResponse> {
  return createOrder(override)
}
