import type { PlaceOrderRequestData, PlaceOrderResponseData } from '../../models/ts/storeController/PlaceOrder.ts'

export function placeOrder(data?: PlaceOrderRequestData, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<PlaceOrderResponseData> {
  return cy
    .request<PlaceOrderResponseData>({
      method: 'post',
      url: '/store/order',
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
