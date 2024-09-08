import { createOrder } from '../createOrder.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createPlaceOrder200() {
  faker.seed([220])
  return createOrder()
}

/**
 * @description Invalid input
 */
export function createPlaceOrder405() {
  faker.seed([220])
  return undefined
}

export function createPlaceOrderMutationRequest() {
  faker.seed([220])
  return createOrder()
}

/**
 * @description successful operation
 */
export function createPlaceOrderMutationResponse() {
  faker.seed([220])
  return createOrder()
}
