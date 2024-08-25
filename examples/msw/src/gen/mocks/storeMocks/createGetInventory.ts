import type { GetInventory200, GetInventoryQueryResponse } from '../../models/GetInventory'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createGetInventory200(): NonNullable<GetInventory200> {
  faker.seed([220])
  return {}
}

/**
 * @description successful operation
 */
export function createGetInventoryQueryResponse(): NonNullable<GetInventoryQueryResponse> {
  faker.seed([220])
  return {}
}
