export type DeleteOrderOrderId = number

export interface DeleteOrderData {
  data?: never
  pathParams: {
    orderId: DeleteOrderOrderId
  }
  queryParams?: never
  headerParams?: never
  url: `/store/order/${string}`
}
