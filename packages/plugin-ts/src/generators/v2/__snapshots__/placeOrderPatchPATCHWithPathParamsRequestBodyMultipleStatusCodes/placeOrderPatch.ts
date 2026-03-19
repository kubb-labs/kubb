export type PlaceOrderPatchPathOrderId = number

/**
 * @description Successful operation
 */
export type PlaceOrderPatchStatus200 = object

/**
 * @description Invalid input
 */
export type PlaceOrderPatchStatus405 = object

/**
 * @description Order payload
 */
export type PlaceOrderPatchData = object

export type PlaceOrderPatchRequestConfig = {
  data?: placeOrderPatchData
  pathParams: {
    orderId: placeOrderPatchPathOrderId
  }
  queryParams?: never
  headerParams?: never
  url: `/store/order/${string}`
}

export type PlaceOrderPatchResponses = {
  '200': placeOrderPatchStatus200
  '405': placeOrderPatchStatus405
}

/**
 * @description Union of all possible responses
 */
export type PlaceOrderPatchResponse = placeOrderPatchStatus200 | placeOrderPatchStatus405
