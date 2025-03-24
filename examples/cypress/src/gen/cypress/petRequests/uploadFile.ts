import type { UploadFileMutationRequest, UploadFileMutationResponse } from '../../models/UploadFile.ts'

export function uploadFile(data?: UploadFileMutationRequest): Cypress.Chainable<UploadFileMutationResponse> {
  return cy.request('post', 'http://localhost:3000/pet/:petId/uploadImage', data).then((res: Cypress.Response<UploadFileMutationResponse>) => res.body)
}
