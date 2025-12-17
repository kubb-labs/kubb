import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../../models/ts/storeController/PlaceOrder.ts'

export function placeOrder(data?: PlaceOrderMutationRequest, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<PlaceOrderMutationResponse> {
  return cy
    .request({
      method: 'post',
      url: '/store/order',
      body: data,
      ...options,
    })
    .then((res: Cypress.Response<PlaceOrderMutationResponse>) => res.body)
}
