import { faker } from '@faker-js/faker'
import { createOrder } from '../createOrder'
import type { PlaceOrder405, PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../../models/PlaceOrder'

/**
 * @description Invalid input
 */

export function createPlaceOrder405(override?: NonNullable<Partial<PlaceOrder405>>): NonNullable<PlaceOrder405> {
  faker.seed([220])
  return undefined
}

export function createPlaceOrderMutationRequest(override?: NonNullable<Partial<PlaceOrderMutationRequest>>): NonNullable<PlaceOrderMutationRequest> {
  faker.seed([220])
  return createOrder(override)
}

/**
 * @description successful operation
 */

export function createPlaceOrderMutationResponse(override?: NonNullable<Partial<PlaceOrderMutationResponse>>): NonNullable<PlaceOrderMutationResponse> {
  faker.seed([220])
  return createOrder(override)
}
