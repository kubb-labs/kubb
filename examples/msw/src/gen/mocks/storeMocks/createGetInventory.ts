import type { GetInventoryQueryResponse } from '../../models/GetInventory'

/**
 * @description successful operation
 */

export function createGetInventoryQueryResponse(override: NonNullable<Partial<GetInventoryQueryResponse>> = {}): NonNullable<GetInventoryQueryResponse> {
  return {
    ...{},
    ...override,
  }
}
