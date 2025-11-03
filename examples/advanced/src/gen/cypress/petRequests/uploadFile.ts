import type { UploadFileMutationRequest, UploadFileMutationResponse } from "../../models/ts/petController/UploadFile.ts";

export function uploadFile(data?: UploadFileMutationRequest): Cypress.Chainable<UploadFileMutationResponse> {
  return cy.request('post', '/pet/:petId/uploadImage', data).then((res: Cypress.Response<UploadFileMutationResponse>) => res.body)
}