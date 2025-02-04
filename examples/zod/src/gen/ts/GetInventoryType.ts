/**
 * @description successful operation
 */
export type GetInventory200Type = {
  [key: string]: number
}

export type GetInventoryQueryResponseType = GetInventory200Type

export type GetInventoryTypeQuery = {
  Response: GetInventory200Type
  Errors: any
}