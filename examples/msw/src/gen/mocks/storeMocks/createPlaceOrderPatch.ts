import type { PlaceOrderPatch200, PlaceOrderPatch405, PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse } from '../../models/PlaceOrderPatch'
import { faker } from '@faker-js/faker'
import { createOrder } from '../createOrder'

/**
 * @description successful operation
 */
export function createPlaceOrderPatch200(): NonNullable<PlaceOrderPatch200> {
  faker.seed([220])
  return createOrder()
}

/**
 * @description Invalid input
 */
export function createPlaceOrderPatch405(): NonNullable<PlaceOrderPatch405> {
  faker.seed([220])
  return undefined
}

export function createPlaceOrderPatchMutationRequest(): NonNullable<PlaceOrderPatchMutationRequest> {
  faker.seed([220])
  return createOrder()
}

/**
 * @description successful operation
 */
export function createPlaceOrderPatchMutationResponse(): NonNullable<PlaceOrderPatchMutationResponse> {
  faker.seed([220])
  return createOrder()
}
