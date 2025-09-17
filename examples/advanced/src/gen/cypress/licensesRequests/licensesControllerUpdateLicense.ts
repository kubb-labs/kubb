import type {
  LicensesControllerUpdateLicenseMutationRequest,
  LicensesControllerUpdateLicenseMutationResponse,
} from '../../models/ts/licensesController/LicensesControllerUpdateLicense.ts'

export function licensesControllerUpdateLicense(
  data: LicensesControllerUpdateLicenseMutationRequest,
): Cypress.Chainable<LicensesControllerUpdateLicenseMutationResponse> {
  return cy.request('patch', '/api/licenses/:id', data).then((res: Cypress.Response<LicensesControllerUpdateLicenseMutationResponse>) => res.body)
}
