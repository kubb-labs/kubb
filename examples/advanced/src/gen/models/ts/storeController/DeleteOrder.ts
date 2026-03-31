/**
 * @type object
 */
export type DeleteOrderPathParams = {
  /**
   * @description ID of the order that needs to be deleted
   * @type integer
   */
  orderId: number
}

/**
 * @description Invalid ID supplied
 * @type any
 */
export type DeleteOrder400 = any

/**
 * @description Order not found
 * @type any
 */
export type DeleteOrder404 = any

export type DeleteOrderMutationResponse = any

/**
 * @type object
 */
export type DeleteOrderMutation = {
  Response: any
  PathParams: DeleteOrderPathParams
  Errors: DeleteOrder400 | DeleteOrder404
}
