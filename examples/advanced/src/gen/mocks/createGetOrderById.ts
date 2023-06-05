import { faker } from '@faker-js/faker'

import { createOrder } from './createOrder'

/**
 * @description Invalid ID supplied
 */

export function createGetOrderById400() {
  return undefined
}

/**
 * @description Order not found
 */

export function createGetOrderById404() {
  return undefined
}

export function createGetOrderByIdPathParams() {
  return { orderId: faker.number.float({}) }
}

/**
 * @description successful operation
 */

export function createGetOrderByIdQueryResponse() {
  return createOrder()
}
