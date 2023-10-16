import { faker } from '@faker-js/faker'

import { DeleteOrder400 } from '../../models/DeleteOrder'
import { DeleteOrder404 } from '../../models/DeleteOrder'
import { DeleteOrderMutationResponse } from '../../models/DeleteOrder'
import { DeleteOrderPathParams } from '../../models/DeleteOrder'

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

export function createDeleteOrderPathParams(): NonNullable<DeleteOrderPathParams> {
  return { orderId: faker.number.float({}) }
}
