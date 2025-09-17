import type { LicensesControllerDeactivateLicenseMutationResponse } from '../../models/ts/licensesController/LicensesControllerDeactivateLicense.ts'

export function licensesControllerDeactivateLicense(): Cypress.Chainable<LicensesControllerDeactivateLicenseMutationResponse> {
  return cy
    .request('post', '/api/licenses/:id/deactivate', undefined)
    .then((res: Cypress.Response<LicensesControllerDeactivateLicenseMutationResponse>) => res.body)
}
