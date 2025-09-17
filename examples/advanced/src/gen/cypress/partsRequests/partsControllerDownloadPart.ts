import type {
  PartsControllerDownloadPartMutationRequest,
  PartsControllerDownloadPartMutationResponse,
} from '../../models/ts/partsController/PartsControllerDownloadPart.ts'

export function partsControllerDownloadPart(data: PartsControllerDownloadPartMutationRequest): Cypress.Chainable<PartsControllerDownloadPartMutationResponse> {
  return cy.request('post', '/api/parts/:urn/download', data).then((res: Cypress.Response<PartsControllerDownloadPartMutationResponse>) => res.body)
}
