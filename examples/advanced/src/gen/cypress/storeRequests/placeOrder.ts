import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../../models/ts/storeController/PlaceOrder.ts'

export function placeOrder(data?: PlaceOrderMutationRequest): Cypress.Chainable<PlaceOrderMutationResponse> {
  return cy.request('post', '/store/order', data).then((res: Cypress.Response<PlaceOrderMutationResponse>) => res.body)
}
