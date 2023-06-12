import useSWRMutation from 'swr/mutation'
import type { SWRMutationConfiguration } from 'swr/mutation'
import client from '../../../../client'
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
export function useUploadFile<TData = UploadFileMutationResponse, TError = unknown, TVariables = UploadFileMutationRequest>(
  petId: UploadFilePathParams['petId'],
  params?: UploadFileQueryParams,
  options?: {
    mutation?: SWRMutationConfiguration<TData, TError, TVariables, string>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useSWRMutation<TData, TError, string, TVariables>(
    `/pet/${petId}/uploadImage`,
    (url, { arg: data }) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url,
        data,
        params,
      })
    },
    mutationOptions
  )
}
