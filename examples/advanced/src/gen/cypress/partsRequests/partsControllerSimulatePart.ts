import type {
  PartsControllerSimulatePartMutationRequest,
  PartsControllerSimulatePartMutationResponse,
} from '../../models/ts/partsController/PartsControllerSimulatePart.ts'

export function partsControllerSimulatePart(data: PartsControllerSimulatePartMutationRequest): Cypress.Chainable<PartsControllerSimulatePartMutationResponse> {
  return cy.request('post', '/api/parts/:urn/simulate', data).then((res: Cypress.Response<PartsControllerSimulatePartMutationResponse>) => res.body)
}
