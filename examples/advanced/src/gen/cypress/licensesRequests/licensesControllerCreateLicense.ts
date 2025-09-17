import type {
  LicensesControllerCreateLicenseMutationRequest,
  LicensesControllerCreateLicenseMutationResponse,
} from '../../models/ts/licensesController/LicensesControllerCreateLicense.ts'

export function licensesControllerCreateLicense(
  data: LicensesControllerCreateLicenseMutationRequest,
): Cypress.Chainable<LicensesControllerCreateLicenseMutationResponse> {
  return cy.request('post', '/api/licenses', data).then((res: Cypress.Response<LicensesControllerCreateLicenseMutationResponse>) => res.body)
}
