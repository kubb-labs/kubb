import { createOrder } from '../createOrder'
import { PlaceOrderPatch405 } from '../../models/PlaceOrderPatch'
import { PlaceOrderPatchMutationRequest } from '../../models/PlaceOrderPatch'
import { PlaceOrderPatchMutationResponse } from '../../models/PlaceOrderPatch'

/**
 * @description Invalid input
 */

export function createPlaceOrderPatch405(): PlaceOrderPatch405 {
  return undefined
}

export function createPlaceOrderPatchMutationRequest(): PlaceOrderPatchMutationRequest {
  return createOrder()
}

/**
 * @description successful operation
 */

export function createPlaceOrderPatchMutationResponse(): PlaceOrderPatchMutationResponse {
  return createOrder()
}
