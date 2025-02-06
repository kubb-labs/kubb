import type { DeleteOrderPathParams } from '../../models/DeleteOrder.ts'
import { faker } from '@faker-js/faker'

export function createDeleteOrderPathParams(data?: Partial<DeleteOrderPathParams>): Partial<DeleteOrderPathParams> {
  faker.seed([220])
  return {
    ...{ orderId: faker.number.int() },
    ...(data || {}),
  }
}

/**
 * @description Invalid ID supplied
 */
export function createDeleteOrder400() {
  faker.seed([220])
  return undefined
}

/**
 * @description Order not found
 */
export function createDeleteOrder404() {
  faker.seed([220])
  return undefined
}

export function createDeleteOrderMutationResponse() {
  faker.seed([220])
  return undefined
}
