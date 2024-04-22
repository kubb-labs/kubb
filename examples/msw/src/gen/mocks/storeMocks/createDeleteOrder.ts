import { faker } from '@faker-js/faker'
import type { DeleteOrderPathParams, DeleteOrder400, DeleteOrder404, DeleteOrderMutationResponse } from '../../models/DeleteOrder'

export function createDeleteOrderPathParams(): NonNullable<DeleteOrderPathParams> {
  return { orderId: faker.number.int() }
}

/**
 * @description Invalid ID supplied
 */
export function createDeleteOrder400(): NonNullable<DeleteOrder400> {
  return undefined
}

/**
 * @description Order not found
 */
export function createDeleteOrder404(): NonNullable<DeleteOrder404> {
  return undefined
}

export function createDeleteOrderMutationResponse(): NonNullable<DeleteOrderMutationResponse> {
  return undefined
}
