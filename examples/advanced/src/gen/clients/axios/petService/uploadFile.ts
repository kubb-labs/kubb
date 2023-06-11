import client from '../client'
import type { UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../../../models/ts/petController/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function uploadFile<TData = UploadFileMutationResponse>(petId: UploadFilePathParams['petId'], params?: UploadFileQueryParams) {
  return client<TData>({
    method: 'post',
    url: `/pet/${petId}/uploadImage`,

    params,
  })
}
