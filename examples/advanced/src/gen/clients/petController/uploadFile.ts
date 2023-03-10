import client from '../../../client'

import type { UploadFileRequest, UploadFileResponse, UploadFilePathParams } from '../../models/ts/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/{petId}/uploadImage
 * @deprecated
 */
export function uploadFile<TData = UploadFileResponse, TVariables = UploadFileRequest>(petId: UploadFilePathParams['petId'], data: TVariables) {
  return client<TData, TVariables>({
    method: 'post',
    url: `/pet/${petId}/uploadImage`,
    data,
  })
}
