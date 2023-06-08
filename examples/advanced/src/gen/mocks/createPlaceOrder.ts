import { faker } from '@faker-js/faker'

import { createOrder } from './createOrder'
import { PlaceOrder405 } from '../models/ts/storeController/PlaceOrder'
import { PlaceOrderMutationRequest } from '../models/ts/storeController/PlaceOrder'
import { PlaceOrderMutationResponse } from '../models/ts/storeController/PlaceOrder'

/**
 * @description Invalid input
 */

export function createPlaceOrder405(): PlaceOrder405 {
  return undefined
}

export function createPlaceOrderMutationRequest(): PlaceOrderMutationRequest {
  return createOrder()
}

/**
 * @description successful operation
 */

export function createPlaceOrderMutationResponse(): PlaceOrderMutationResponse {
  return createOrder()
}
