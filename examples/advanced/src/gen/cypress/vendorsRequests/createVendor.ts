import type { CreateVendorMutationRequest, CreateVendorMutationResponse } from '../../models/ts/vendorsController/CreateVendor.ts'

export function createVendor(data: CreateVendorMutationRequest): Cypress.Chainable<CreateVendorMutationResponse> {
  return cy.request('post', '/v1/vendors', data).then((res: Cypress.Response<CreateVendorMutationResponse>) => res.body)
}
