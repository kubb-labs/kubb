import { createOrder } from '../createOrder'
import { PlaceOrderPatch405, PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse } from '../../models/PlaceOrderPatch'

/**
 * @description Invalid input
 */

export function createPlaceOrderPatch405(): NonNullable<PlaceOrderPatch405> {
  return undefined
}

export function createPlaceOrderPatchMutationRequest(): NonNullable<PlaceOrderPatchMutationRequest> {
  return createOrder()
}
/**
 * @description successful operation
 */

export function createPlaceOrderPatchMutationResponse(): NonNullable<PlaceOrderPatchMutationResponse> {
  return createOrder()
}
