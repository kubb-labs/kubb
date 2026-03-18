export type DeleteOrderPathOrderId = number

export interface DeleteOrderRequestConfig {
  data?: never
  pathParams: {
    orderId: DeleteOrderPathOrderId
  }
  queryParams?: never
  headerParams?: never
  url: `/store/order/${string}`
}
