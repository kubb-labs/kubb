import { faker } from '@faker-js/faker'

import { DeleteOrder400 } from '../../models/DeleteOrder'
import { DeleteOrder404 } from '../../models/DeleteOrder'
import { DeleteOrderMutationResponse } from '../../models/DeleteOrder'
import { DeleteOrderPathParams } from '../../models/DeleteOrder'

/**
 * @description Invalid ID supplied
 */
export function createDeleteOrder400(): DeleteOrder400 {
  return undefined
}

/**
 * @description Order not found
 */
export function createDeleteOrder404(): DeleteOrder404 {
  return undefined
}

export function createDeleteOrderMutationResponse(): DeleteOrderMutationResponse {
  return undefined
}

export function createDeleteOrderPathParams(): DeleteOrderPathParams {
  return { orderId: faker.number.float({}) }
}
