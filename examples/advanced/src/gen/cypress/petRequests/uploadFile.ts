import type { UploadFilePathParams, UploadFileQueryParams, UploadFileRequestData, UploadFileResponseData } from '../../models/ts/petController/UploadFile.ts'

export function uploadFile(
  petId: UploadFilePathParams['petId'],
  data?: UploadFileRequestData,
  params?: UploadFileQueryParams,
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<UploadFileResponseData> {
  return cy
    .request<UploadFileResponseData>({
      method: 'post',
      url: `/pet/${petId}/uploadImage`,
      qs: params,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
