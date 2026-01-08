import type { AddFilesRequestData, AddFilesResponseData } from '../../models/ts/petController/AddFiles.ts'

export function addFiles(data: AddFilesRequestData, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<AddFilesResponseData> {
  return cy
    .request<AddFilesResponseData>({
      method: 'post',
      url: '/pet/files',
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
