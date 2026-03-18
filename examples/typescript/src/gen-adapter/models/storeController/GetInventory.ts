/**
 * @description successful operation
 */
export interface GetInventory200 {
  [key: string]: number
}

export interface GetInventoryData {
  data?: never
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/store/inventory'
}

export interface GetInventoryResponses {
  '200': GetInventory200
}

export type GetInventoryResponse = GetInventory200
