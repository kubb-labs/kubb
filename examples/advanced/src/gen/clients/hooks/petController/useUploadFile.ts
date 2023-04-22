import { useMutation } from '@tanstack/react-query'

import client from '../../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { UploadFileMutationResponse, UploadFilePathParams, UploadFileQueryParams } from '../../../models/ts/petController/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */
export function useUploadFile<TData = UploadFileMutationResponse, TError = unknown>(
  petId: UploadFilePathParams['petId'],
  params?: UploadFileQueryParams,
  options?: {
    mutation?: UseMutationOptions<TData, TError>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, TError>({
    mutationFn: () => {
      return client<TData, TError>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,

        params,
      })
    },
    ...mutationOptions,
  })
}
