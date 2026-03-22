/**
 * @description successful operation
 */
export type GetInventory200 = {
  [key: string]: number
}

export type GetInventoryQueryResponse = GetInventory200

export type GetInventoryQuery = {
  /**
   * @type object
   */
  Response: GetInventory200
  Errors: any
}
