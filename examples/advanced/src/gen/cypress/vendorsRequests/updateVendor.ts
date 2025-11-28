import type { UpdateVendorMutationRequest, UpdateVendorMutationResponse } from '../../models/ts/vendorsController/UpdateVendor.ts'

export function updateVendor(data?: UpdateVendorMutationRequest): Cypress.Chainable<UpdateVendorMutationResponse> {
  return cy.request('put', '/v1/vendors/:id', data).then((res: Cypress.Response<UpdateVendorMutationResponse>) => res.body)
}
