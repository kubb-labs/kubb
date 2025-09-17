import type {
  LicensesControllerActivateLicenseMutationRequest,
  LicensesControllerActivateLicenseMutationResponse,
} from '../../models/ts/licensesController/LicensesControllerActivateLicense.ts'

export function licensesControllerActivateLicense(
  data: LicensesControllerActivateLicenseMutationRequest,
): Cypress.Chainable<LicensesControllerActivateLicenseMutationResponse> {
  return cy.request('post', '/api/licenses/:id/activate', data).then((res: Cypress.Response<LicensesControllerActivateLicenseMutationResponse>) => res.body)
}
