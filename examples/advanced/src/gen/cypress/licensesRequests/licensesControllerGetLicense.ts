import type { LicensesControllerGetLicenseQueryResponse } from '../../models/ts/licensesController/LicensesControllerGetLicense.ts'

export function licensesControllerGetLicense(): Cypress.Chainable<LicensesControllerGetLicenseQueryResponse> {
  return cy.request('get', '/api/licenses/:id', undefined).then((res: Cypress.Response<LicensesControllerGetLicenseQueryResponse>) => res.body)
}
