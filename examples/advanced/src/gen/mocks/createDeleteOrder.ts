import { faker } from '@faker-js/faker'

/**
 * @description Invalid ID supplied
 */

export function createDeleteOrder400() {
  return undefined
}

/**
 * @description Order not found
 */

export function createDeleteOrder404() {
  return undefined
}

export function createDeleteOrderMutationResponse() {
  return undefined
}

export function createDeleteOrderPathParams() {
  return { orderId: faker.number.float({}) }
}
