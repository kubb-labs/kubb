import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query'
import client from '../../../../client'
import type {
  UploadFileMutationRequest,
  UploadFileMutationResponse,
  UploadFilePathParams,
  UploadfileQueryparams,
} from '../../../models/ts/petController/UploadFile'

/**
 * @summary uploads an image
 * @link /pet/:petId/uploadImage
 */

export function useUploadfile<TData = UploadFileMutationResponse, TError = unknown, TVariables = UploadFileMutationRequest>(
  petId: UploadFilePathParams['petId'],
  params?: UploadfileQueryparams,
  options: {
    mutation?: UseMutationOptions<TData, TError, TVariables>
    client?: Partial<Parameters<typeof client<TData, TError, TVariables>>[0]>
  } = {},
): UseMutationResult<TData, TError, TVariables> {
  const { mutation: mutationOptions, client: clientOptions = {} } = options ?? {}

  return useMutation<TData, TError, TVariables>({
    mutationFn: (data) => {
      return client<TData, TError, TVariables>({
        method: 'post',
        url: `/pet/${petId}/uploadImage`,
        data,
        params,

        ...clientOptions,
      })
    },
    ...mutationOptions,
  })
}
