export type DeleteOrderPathParamsType = {
  /**
   * @description ID of the order that needs to be deleted
   * @type integer, int64
   */
  orderId: number
}
/**
 * @description Invalid ID supplied
 */
export type DeleteOrder400Type = any
/**
 * @description Order not found
 */
export type DeleteOrder404Type = any
export type DeleteOrderMutationResponseType = any
export type DeleteOrderTypeMutation = {
  Response: DeleteOrderMutationResponseType
  PathParams: DeleteOrderPathParamsType
  Errors: DeleteOrder400Type | DeleteOrder404Type
}
