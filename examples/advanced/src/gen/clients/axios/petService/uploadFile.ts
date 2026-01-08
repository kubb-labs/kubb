import fetch from '../../../../axios-client.ts'
import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UploadFileRequestData, UploadFileResponseData, UploadFilePathParams, UploadFileQueryParams } from '../../../models/ts/petController/UploadFile.ts'
import { uploadFileResponseData2Schema, uploadFileRequestData2Schema } from '../../../zod/petController/uploadFileSchema.ts'

export function getUploadFileUrl({ petId }: { petId: UploadFilePathParams['petId'] }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pet/${petId}/uploadImage` as const }
  return res
}

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(
  { petId, data, params }: { petId: UploadFilePathParams['petId']; data?: UploadFileRequestData; params?: UploadFileQueryParams },
  config: Partial<RequestConfig<UploadFileRequestData>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = uploadFileRequestData2Schema.parse(data)

  const res = await request<UploadFileResponseData, ResponseErrorConfig<Error>, UploadFileRequestData>({
    method: 'POST',
    url: getUploadFileUrl({ petId }).url.toString(),
    params,
    data: requestData,
    ...requestConfig,
    headers: { 'Content-Type': 'application/octet-stream', ...requestConfig.headers },
  })
  return { ...res, data: uploadFileResponseData2Schema.parse(res.data) }
}
