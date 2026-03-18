export type placeOrderPatchPathOrderId = number

/**
 * @description Successful operation
 */
export type placeOrderPatchStatus200 = object

/**
 * @description Invalid input
 */
export type placeOrderPatchStatus405 = object

/**
 * @description Order payload
 */
export type placeOrderPatchData = object

export type placeOrderPatchRequestConfig = {
  data?: placeOrderPatchData
  pathParams: {
    orderId: placeOrderPatchPathOrderId
  }
  queryParams?: never
  headerParams?: never
  url: `/store/order/${string}`
}

export type placeOrderPatchResponses = {
  '200': placeOrderPatchStatus200
  '405': placeOrderPatchStatus405
}

/**
 * @description Union of all possible responses
 */
export type placeOrderPatchResponse = placeOrderPatchStatus200 | placeOrderPatchStatus405
