import type { ResponseConfig } from '../../../../axios-client.ts'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
} from '../../../models/ts/petController/UploadFile'
import client from '../../../../axios-client.ts'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export async function uploadFile(
  {
    petId,
  }: {
    petId: UploadFilePathParams['petId']
  },
  data?: UploadFileMutationRequest,
  params?: UploadFileQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<UploadFileMutationResponse>> {
  const res = await client<UploadFileMutationResponse, UploadFileMutationRequest>({
    method: 'post',
    url: `/pet/${petId}/uploadImage`,
    params,
    data,
    headers: { 'Content-Type': 'application/octet-stream', ...options.headers },
    ...options,
  })
  return res
}
