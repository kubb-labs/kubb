import { faker } from '@faker-js/faker'
import { createOrder } from '../createOrder'
import type { PlaceOrderPatch405, PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse } from '../../models/PlaceOrderPatch'

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
