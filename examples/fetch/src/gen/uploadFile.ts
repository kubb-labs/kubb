import client from '@kubb/plugin-client/clients/fetch'
import type { UploadFileMutationRequest, UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from './models.ts'
import type { RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

export function getUploadFileUrl(petId: UploadFilePathParams['petId']) {
  return `/pet/${petId}/uploadImage` as const
}

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(
  petId: UploadFilePathParams['petId'],
  data: UploadFileMutationRequest,
  params?: UploadFileQueryParams,
  config: Partial<RequestConfig<UploadFileMutationRequest>> & { client?: typeof client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const formData = new FormData()
  if (data) {
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof typeof data]
      if (typeof key === 'string' && (typeof value === 'string' || (value as Blob) instanceof Blob)) {
        formData.append(key, value as unknown as string)
      }
    })
  }
  const res = await request<UploadFileMutationResponse, ResponseErrorConfig<Error>, UploadFileMutationRequest>({
    method: 'POST',
    url: getUploadFileUrl(petId).toString(),
    params,
    data: formData,
    ...requestConfig,
    headers: { 'Content-Type': 'multipart/form-data', ...requestConfig.headers },
  })
  return res.data
}
