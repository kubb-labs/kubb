export type placeOrderPatchOrderId = number

/**
 * @description Successful operation
 */
export type placeOrderPatch200 = object

/**
 * @description Invalid input
 */
export type placeOrderPatch405 = object

/**
 * @description Order payload
 */
export type placeOrderPatchMutationRequest = object

export type placeOrderPatchData = {
  data?: placeOrderPatchMutationRequest
  pathParams: {
    orderId: placeOrderPatchOrderId
  }
  queryParams?: never
  headerParams?: never
  url: `/store/order/${string}`
}

export type placeOrderPatchResponses = {
  '200': placeOrderPatch200
  '405': placeOrderPatch405
}

export type placeOrderPatchResponse = placeOrderPatch200 | placeOrderPatch405
