import type { GetInventory200, GetInventoryQueryResponse } from '../../models/GetInventory'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createGetInventory200(data: NonNullable<Partial<GetInventory200>> = {}): NonNullable<GetInventory200> {
  faker.seed([220])
  return {
    ...{},
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createGetInventoryQueryResponse(data: NonNullable<Partial<GetInventoryQueryResponse>> = {}): NonNullable<GetInventoryQueryResponse> {
  faker.seed([220])
  return {
    ...{},
    ...data,
  }
}
