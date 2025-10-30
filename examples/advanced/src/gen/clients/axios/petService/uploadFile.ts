import type { RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
} from '../../../models/ts/petController/UploadFile.ts'
import { uploadFileMutationRequestSchema, uploadFileMutationResponseSchema } from '../../../zod/petController/uploadFileSchema.ts'

export function getUploadFileUrl({ petId }: { petId: UploadFilePathParams['petId'] }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pet/${petId}/uploadImage` as const }
  return res
}

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFile(
  { petId, data, params }: { petId: UploadFilePathParams['petId']; data?: UploadFileMutationRequest; params?: UploadFileQueryParams },
  config: Partial<RequestConfig<UploadFileMutationRequest>> & { client?: typeof fetch } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = uploadFileMutationRequestSchema.parse(data)

  const res = await request<UploadFileMutationResponse, ResponseErrorConfig<Error>, UploadFileMutationRequest>({
    method: 'POST',
    url: getUploadFileUrl({ petId }).url.toString(),
    params,
    data: requestData,
    ...requestConfig,
    headers: { 'Content-Type': 'application/octet-stream', ...requestConfig.headers },
  })
  return { ...res, data: uploadFileMutationResponseSchema.parse(res.data) }
}
