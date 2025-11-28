import type { ListVendorsQueryResponse } from '../../models/ts/vendorsController/ListVendors.ts'

export function listVendors(): Cypress.Chainable<ListVendorsQueryResponse> {
  return cy.request('get', '/v1/vendors', undefined).then((res: Cypress.Response<ListVendorsQueryResponse>) => res.body)
}
