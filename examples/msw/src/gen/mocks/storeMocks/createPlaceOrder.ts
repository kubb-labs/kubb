import { createOrder } from '../createOrder'
import { PlaceOrder405 } from '../../models/PlaceOrder'
import { PlaceOrderMutationRequest } from '../../models/PlaceOrder'
import { PlaceOrderMutationResponse } from '../../models/PlaceOrder'

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
