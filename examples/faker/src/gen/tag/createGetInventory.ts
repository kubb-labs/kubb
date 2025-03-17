import type { GetInventory200, GetInventoryQueryResponse } from '../models/GetInventory.ts'
import { faker } from '@faker-js/faker'

/**
 * @description successful operation
 */
export function createGetInventory200(data?: Partial<GetInventory200>): GetInventory200 {
  return {
    ...{},
    ...(data || {}),
  }
}

export function createGetInventoryQueryResponse(data?: Partial<GetInventoryQueryResponse>): GetInventoryQueryResponse {
  return data || faker.helpers.arrayElement<any>([createGetInventory200()])
}
