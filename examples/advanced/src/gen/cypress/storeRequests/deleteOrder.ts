import type { DeleteOrderMutationResponse } from "../../models/ts/storeController/DeleteOrder.ts";

export function deleteOrder(): Cypress.Chainable<DeleteOrderMutationResponse> {
  return cy.request('delete', '/store/order/:orderId', undefined).then((res: Cypress.Response<DeleteOrderMutationResponse>) => res.body)
}