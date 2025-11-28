import type { DeleteVendorMutationResponse } from '../../models/ts/vendorsController/DeleteVendor.ts'

export function deleteVendor(): Cypress.Chainable<DeleteVendorMutationResponse> {
  return cy.request('delete', '/v1/vendors/:id', undefined).then((res: Cypress.Response<DeleteVendorMutationResponse>) => res.body)
}
