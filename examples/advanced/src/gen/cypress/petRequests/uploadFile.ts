import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
} from '../../models/ts/petController/UploadFile.ts'

export function uploadFile(
  petId: UploadFilePathParams['petId'],
  data?: UploadFileMutationRequest,
  params?: UploadFileQueryParams,
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<UploadFileMutationResponse> {
  return cy
    .request<UploadFileMutationResponse>({
      method: 'post',
      url: `/pet/${petId}/uploadImage`,
      qs: params,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
