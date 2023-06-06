import { faker } from '@faker-js/faker'

import type { DeleteOrder400, DeleteOrder404, DeleteOrderMutationResponse, DeleteOrderPathParams } from '../models/ts/storeController/DeleteOrder'

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
