import type { PlaceOrderMutationResponse } from '../models/PlaceOrder.ts'
import { createOrder } from './createOrder.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createPlaceOrder200() {
  return createOrder()
}

/**
 * @description Invalid input
 */
export function createPlaceOrder405() {
  return undefined
}

export function createPlaceOrderMutationRequest() {
  return createOrder()
}

export function createPlaceOrderMutationResponse(data?: Partial<PlaceOrderMutationResponse>) {
  return faker.helpers.arrayElement<any>([createPlaceOrder200()]) || data
}
