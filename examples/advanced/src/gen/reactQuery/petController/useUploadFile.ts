import { useMutation } from '@tanstack/react-query'

import client from '../../../client'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { UploadFileRequest, UploadFileResponse, UploadFilePathParams } from '../../models/ts/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/{petId}/uploadImage
 */
export function useUploadFile<TData = UploadFileResponse, TVariables = UploadFileRequest>(
  petId: UploadFilePathParams['petId'],
  options?: {
    mutation?: UseMutationOptions<TData, unknown, TVariables>
  }
) {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return client<TData, TVariables>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        data,
      })
    },
    ...mutationOptions,
  })
}
