import type {
  ResellersControllerUpdateResellerMutationRequest,
  ResellersControllerUpdateResellerMutationResponse,
} from '../../models/ts/resellersController/ResellersControllerUpdateReseller.ts'

export function resellersControllerUpdateReseller(
  data: ResellersControllerUpdateResellerMutationRequest,
): Cypress.Chainable<ResellersControllerUpdateResellerMutationResponse> {
  return cy.request('patch', '/api/resellers/:id', data).then((res: Cypress.Response<ResellersControllerUpdateResellerMutationResponse>) => res.body)
}
