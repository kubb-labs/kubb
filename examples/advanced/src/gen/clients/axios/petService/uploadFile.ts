import client from '../client'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadFileQueryParams,
} from '../../../models/ts/petController/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function uploadFile<TData = UploadFileMutationResponse, TVariables = UploadFileMutationRequest>(
  petId: UploadFilePathParams['petId'],
  data: TVariables,
  params?: UploadFileQueryParams
): Promise<TData> {
  return client<TData, TVariables>({
    method: 'post',
    url: `/pet/${petId}/uploadImage`,
    params,
    data,
  })
}
