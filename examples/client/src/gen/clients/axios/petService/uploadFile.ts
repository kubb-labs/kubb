import client from '@kubb/swagger-client/client'
import type { ResponseConfig } from '@kubb/swagger-client/client'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
} from '../../../models/ts/petController/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage */

export async function uploadFile(
  petId: UploadFilePathParams['petId'],
  data?: UploadFileMutationRequest,
  params?: UploadFileQueryParams,
  options: Partial<Parameters<typeof client>[0]> = {},
): Promise<ResponseConfig<UploadFileMutationResponse>['data']> {
  const res = await client<UploadFileMutationResponse, UploadFileMutationRequest>({
    method: 'post',
    url: `/pet/${petId}/uploadImage`,
    params,
    data,
    ...options,
  })
  return res.data
}
