import { faker } from '@faker-js/faker'
import type { DeleteOrder400, DeleteOrder404, DeleteOrderMutationResponse, DeleteOrderPathParams } from '../../models/DeleteOrder'

/**
 * @description Invalid ID supplied
 */

export function createDeleteOrder400(override?: NonNullable<Partial<DeleteOrder400>>): NonNullable<DeleteOrder400> {
  return undefined
}
/**
 * @description Order not found
 */

export function createDeleteOrder404(override?: NonNullable<Partial<DeleteOrder404>>): NonNullable<DeleteOrder404> {
  return undefined
}

export function createDeleteOrderMutationResponse(override?: NonNullable<Partial<DeleteOrderMutationResponse>>): NonNullable<DeleteOrderMutationResponse> {
  return undefined
}

export function createDeleteOrderPathParams(override: NonNullable<Partial<DeleteOrderPathParams>> = {}): NonNullable<DeleteOrderPathParams> {
  return {
    ...{ 'orderId': faker.number.int({}) },
    ...override,
  }
}
