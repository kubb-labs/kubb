import { faker } from '@faker-js/faker'
import type { DeleteOrder400, DeleteOrder404, DeleteOrderMutationResponse, DeleteOrderPathParams } from '../../models/DeleteOrder'

export function createDeleteOrderPathParams(override: NonNullable<Partial<DeleteOrderPathParams>> = {}): NonNullable<DeleteOrderPathParams> {
  faker.seed([220])
  return {
    ...{ orderId: faker.number.int() },
    ...override,
  }
}

/**
 * @description Invalid ID supplied
 */
export function createDeleteOrder400(): NonNullable<DeleteOrder400> {
  faker.seed([220])
  return undefined
}

/**
 * @description Order not found
 */
export function createDeleteOrder404(): NonNullable<DeleteOrder404> {
  faker.seed([220])
  return undefined
}

export function createDeleteOrderMutationResponse(): NonNullable<DeleteOrderMutationResponse> {
  faker.seed([220])
  return undefined
}
