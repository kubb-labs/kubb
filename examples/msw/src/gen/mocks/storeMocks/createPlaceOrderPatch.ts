import type { PlaceOrderPatch200, PlaceOrderPatch405, PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse } from '../../models/PlaceOrderPatch'
import { createOrder } from '../createOrder'

/**
 * @description successful operation
 */
export function createPlaceOrderPatch200(override?: NonNullable<Partial<PlaceOrderPatch200>>): NonNullable<PlaceOrderPatch200> {
  return createOrder(override)
}

/**
 * @description Invalid input
 */
export function createPlaceOrderPatch405(override?: NonNullable<Partial<PlaceOrderPatch405>>): NonNullable<PlaceOrderPatch405> {
  return undefined
}

export function createPlaceOrderPatchMutationRequest(
  override?: NonNullable<Partial<PlaceOrderPatchMutationRequest>>,
): NonNullable<PlaceOrderPatchMutationRequest> {
  return createOrder(override)
}

/**
 * @description successful operation
 */
export function createPlaceOrderPatchMutationResponse(
  override?: NonNullable<Partial<PlaceOrderPatchMutationResponse>>,
): NonNullable<PlaceOrderPatchMutationResponse> {
  return createOrder(override)
}
