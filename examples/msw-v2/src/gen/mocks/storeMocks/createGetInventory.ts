import { faker } from '@faker-js/faker'
import type { GetInventoryQueryResponse } from '../../models/GetInventory'

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
