import { createOrder } from '../createOrder'
import type { PlaceOrder200, PlaceOrder405, PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../../models/PlaceOrder'

/**
 * @description successful operation
 */
export function createPlaceOrder200(): NonNullable<PlaceOrder200> {
  return createOrder()
}

/**
 * @description Invalid input
 */
export function createPlaceOrder405(): NonNullable<PlaceOrder405> {
  return undefined
}

export function createPlaceOrderMutationRequest(): NonNullable<PlaceOrderMutationRequest> {
  return createOrder()
}

/**
 * @description successful operation
 */
export function createPlaceOrderMutationResponse(): NonNullable<PlaceOrderMutationResponse> {
  return createOrder()
}
