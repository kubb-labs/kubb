import type { UploadFileMutationRequest, UploadFileMutationResponse } from '../../models/ts/petController/UploadFile.ts'

export function uploadFile(data?: UploadFileMutationRequest, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<UploadFileMutationResponse> {
  return cy
    .request({
      method: 'post',
      url: '/pet/:petId/uploadImage',
      body: data,
      ...options,
    })
    .then((res: Cypress.Response<UploadFileMutationResponse>) => res.body)
}
