import type { PlaceOrderMutationRequest, PlaceOrderMutationResponse } from '../../models/PlaceOrder.ts'

export function placeOrder(data?: PlaceOrderMutationRequest): Cypress.Chainable<PlaceOrderMutationResponse> {
  return cy.request('post', 'http://localhost:3000/store/order', data).then((res: Cypress.Response<PlaceOrderMutationResponse>) => res.body)
}
