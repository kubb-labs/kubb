import { faker } from '@faker-js/faker'
import { createOrder } from '../createOrder'
import type { PlaceOrder200, PlaceOrder405, PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../../models/PlaceOrder'

/**
 * @description successful operation
 */
export function createPlaceOrder200(): NonNullable<PlaceOrder200> {
  faker.seed([220])
  return createOrder()
}

/**
 * @description Invalid input
 */
export function createPlaceOrder405(): NonNullable<PlaceOrder405> {
  faker.seed([220])
  return undefined
}

export function createPlaceOrderMutationRequest(): NonNullable<PlaceOrderMutationRequest> {
  faker.seed([220])
  return createOrder()
}

/**
 * @description successful operation
 */
export function createPlaceOrderMutationResponse(): NonNullable<PlaceOrderMutationResponse> {
  faker.seed([220])
  return createOrder()
}
