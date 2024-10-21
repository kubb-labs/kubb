import type { PlaceOrderPatchMutationResponse } from '../../models/PlaceOrderPatch.ts'
import { createOrder } from '../createOrder.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createPlaceOrderPatch200() {
  faker.seed([220])
  return createOrder()
}

/**
 * @description Invalid input
 */
export function createPlaceOrderPatch405() {
  faker.seed([220])
  return undefined
}

export function createPlaceOrderPatchMutationRequest() {
  faker.seed([220])
  return createOrder()
}

export function createPlaceOrderPatchMutationResponse(data?: Partial<PlaceOrderPatchMutationResponse>) {
  faker.seed([220])
  return faker.helpers.arrayElement<any>([createPlaceOrderPatch200()]) || data
}
