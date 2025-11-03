import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse } from "../../models/ts/storeController/PlaceOrderPatch.ts";

export function placeOrderPatch(data?: PlaceOrderPatchMutationRequest): Cypress.Chainable<PlaceOrderPatchMutationResponse> {
  return cy.request('patch', '/store/order', data).then((res: Cypress.Response<PlaceOrderPatchMutationResponse>) => res.body)
}