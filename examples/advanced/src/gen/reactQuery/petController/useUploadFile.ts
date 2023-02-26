import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

import type { UseMutationOptions } from '@tanstack/react-query'
import type { UploadFileRequest, UploadFileResponse, UploadFilePathParams } from '../../models/ts/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/{petId}/uploadImage
 */
export const useUploadFile = <TData = UploadFileResponse, TVariables = UploadFileRequest>(
  petId: UploadFilePathParams['petId'],
  options?: {
    mutation?: UseMutationOptions<TData, unknown, TVariables>
  }
) => {
  const { mutation: mutationOptions } = options ?? {}

  return useMutation<TData, unknown, TVariables>({
    mutationFn: (data) => {
      return axios.post(`/pet/${petId}/uploadImage`, data).then((res) => res.data)
    },
    ...mutationOptions,
  })
}
