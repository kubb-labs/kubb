import type { LicensesControllerGetLicensesQueryResponse } from '../../models/ts/licensesController/LicensesControllerGetLicenses.ts'

export function licensesControllerGetLicenses(): Cypress.Chainable<LicensesControllerGetLicensesQueryResponse> {
  return cy.request('get', '/api/licenses', undefined).then((res: Cypress.Response<LicensesControllerGetLicensesQueryResponse>) => res.body)
}
