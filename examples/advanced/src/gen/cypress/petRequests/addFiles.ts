import type { AddFilesMutationRequest, AddFilesMutationResponse } from '../../models/ts/petController/AddFiles.ts'

export function addFiles(data: AddFilesMutationRequest, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<AddFilesMutationResponse> {
  return cy
    .request({
      method: 'post',
      url: '/pet/files',
      body: data,
      ...options,
    })
    .then((res: Cypress.Response<AddFilesMutationResponse>) => res.body)
}
