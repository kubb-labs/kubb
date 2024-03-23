import { faker } from '@faker-js/faker'
import { GetInventory200, GetInventoryQueryResponse } from '../../models/GetInventory'

/**
 * @description successful operation
 */
export function createGetInventory200(override: NonNullable<Partial<GetInventory200>> = {}): NonNullable<GetInventory200> {
  faker.seed([220])
  return {
    ...{},
    ...override,
  }
}

/**
 * @description successful operation
 */
export function createGetInventoryQueryResponse(override: NonNullable<Partial<GetInventoryQueryResponse>> = {}): NonNullable<GetInventoryQueryResponse> {
  faker.seed([220])
  return {
    ...{},
    ...override,
  }
}
