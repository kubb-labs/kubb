import { PlaceOrder405, PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../../models/PlaceOrder'
import { createOrder } from '../createOrder'

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
