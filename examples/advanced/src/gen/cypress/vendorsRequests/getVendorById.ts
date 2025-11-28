import type { GetVendorByIdQueryResponse } from '../../models/ts/vendorsController/GetVendorById.ts'

export function getVendorById(): Cypress.Chainable<GetVendorByIdQueryResponse> {
  return cy.request('get', '/v1/vendors/:id', undefined).then((res: Cypress.Response<GetVendorByIdQueryResponse>) => res.body)
}
