import type {
  ResellersControllerCreateResellerMutationRequest,
  ResellersControllerCreateResellerMutationResponse,
} from '../../models/ts/resellersController/ResellersControllerCreateReseller.ts'

export function resellersControllerCreateReseller(
  data: ResellersControllerCreateResellerMutationRequest,
): Cypress.Chainable<ResellersControllerCreateResellerMutationResponse> {
  return cy.request('post', '/api/resellers', data).then((res: Cypress.Response<ResellersControllerCreateResellerMutationResponse>) => res.body)
}
