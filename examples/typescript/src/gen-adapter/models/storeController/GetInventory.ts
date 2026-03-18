/**
 * @description successful operation
 */
export interface GetInventoryStatus200 {
  [key: string]: number
}

export interface GetInventoryRequestConfig {
  data?: never
  pathParams?: never
  queryParams?: never
  headerParams?: never
  url: '/store/inventory'
}

export interface GetInventoryResponses {
  '200': GetInventoryStatus200
}

/**
 * @description Union of all possible responses
 */
export type GetInventoryResponse = GetInventoryStatus200
