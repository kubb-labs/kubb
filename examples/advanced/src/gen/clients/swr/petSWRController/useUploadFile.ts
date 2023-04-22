import useSWRMutation from 'swr/mutation'

import client from '../../../../client'

import type { SWRMutationConfiguration } from 'swr/mutation'
import type { UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../../../models/ts/petController/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function useUploadFile<TData = UploadFileMutationResponse, TError = unknown>(
  petId: UploadFilePathParams['petId'],
  params?: UploadFileQueryParams,
  options?: {
    mutation?: SWRMutationConfiguration<TData, TError, string>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useSWRMutation<TData, TError, string>(
    `/pet/${petId}/uploadImage`,
    (url) => {
      return client<TData, TError>({
        method: 'post',
        url,

        params,
      })
    },
    mutationOptions
  )
}
