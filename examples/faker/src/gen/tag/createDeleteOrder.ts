import type { DeleteOrderPathParams } from '../models/DeleteOrder.ts'
import { faker } from '@faker-js/faker'

export function createDeleteOrderPathParams(data: NonNullable<Partial<DeleteOrderPathParams>> = {}) {
  return {
    ...{ orderId: faker.number.int() },
    ...data,
  }
}

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
