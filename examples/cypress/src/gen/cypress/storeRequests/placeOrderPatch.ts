import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse } from '../../models/PlaceOrderPatch.ts'

export function placeOrderPatch(data?: PlaceOrderPatchMutationRequest): Cypress.Chainable<PlaceOrderPatchMutationResponse> {
  return cy.request('patch', 'http://localhost:3000/store/order', data).then((res: Cypress.Response<PlaceOrderPatchMutationResponse>) => res.body)
}
