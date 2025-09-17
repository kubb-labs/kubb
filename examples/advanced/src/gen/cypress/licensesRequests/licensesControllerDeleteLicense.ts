import type { LicensesControllerDeleteLicenseMutationResponse } from '../../models/ts/licensesController/LicensesControllerDeleteLicense.ts'

export function licensesControllerDeleteLicense(): Cypress.Chainable<LicensesControllerDeleteLicenseMutationResponse> {
  return cy.request('delete', '/api/licenses/:id', undefined).then((res: Cypress.Response<LicensesControllerDeleteLicenseMutationResponse>) => res.body)
}
