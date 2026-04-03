/**
 * @description successful operation
 */
export function createGetInventory200(data?: Partial<GetInventory200>): GetInventory200 {

  return {
    ...{},
    ...data || {}
  }
}

export function createGetInventoryQueryResponse(data?: Partial<GetInventoryQueryResponse>): GetInventoryQueryResponse {

  return data || faker.helpers.arrayElement<any>([createGetInventory200()])
}